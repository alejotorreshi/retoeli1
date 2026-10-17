---
phase: 03-chat-web-api-sse-y-despliegue
plan: 05
subsystem: ui
tags: [react, css-modules, design-tokens, guardian, bun-transpiler, accesibilidad]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "web/ con Vite + React, reductor conversacion con el error por turno, cliente SSE flujo-chat y alias @web/ (03-03); guardia de acceso (03-04)"
provides:
  - "tests/arquitectura-web.test.ts (W1-W13): guardián de web/src con una prueba de violación por regla y una prueba de no vacuidad sobre web/src/app.tsx y aviso.module.css"
  - "tests/sin-comentarios.test.ts recorre también web/**/*.{ts,tsx,css} y web/index.html, sin web/dist"
  - "Escáneres compartidos: tests/helpers/escaner-fuentes.helper.ts (extraerImportacionesConTipo, literalesDeTexto, LITERAL_DE_REGEX, ENUM_DE_TS, EXPORTA_TIPO…) y tests/helpers/comentarios.helper.ts (TS/TSX, CSS y HTML)"
  - "web/src/styles/tokens.css con todos los tokens de la UI-SPEC y web/src/styles/global.css (100dvh, .sr-only, .transicion, .girar, prefers-reduced-motion)"
  - "web/src/components/icons/iconos.tsx: IconoCheck, IconoX, IconoAlerta, IconoChevron, IconoDescargar, IconoOjo, IconoReloj, IconoGirando, IconoInfo (16 y 20 px)"
  - "web/src/components/aviso.tsx: AvisoError (role=alert) y AvisoSistema (role=status) con espacio opcional de acciones"
  - "app.tsx pinta el error del turno con AvisoError y devuelve el borrador al compositor ante ERROR_HTTP o ERROR_RED"
affects: [03-07, 03-09, 03-10, 03-25, 03-26]

actuals:
  tokens: 17700
  tasks: 2
  commits: 2
plan_head_before: 1f62705f017dd64cf395d8496a6d51b45340e500
plan_head_after: 891428aa434a42d82c9b8b4e39332638253ef738

tech-stack:
  added: []
  patterns:
    - "El texto JSX se revisa transpilando con Bun.Transpiler (loader tsx): el texto entre etiquetas se vuelve literal de cadena y pasa por el mismo literalesDeTexto + TEXTO_LEGIBLE que G8"
    - "extraerImportacionesConTipo distingue import type de import de valor, para permitir @/http/types/** solo como tipo"
    - "Tokens con nombre en español (--acento, --espacio-md, --error-texto…); los módulos CSS solo usan var(--…)"
    - "prefers-reduced-motion baja --duracion-transicion a 0ms y apaga .transicion y .girar"

key-files:
  created:
    - tests/arquitectura-web.test.ts
    - tests/helpers/escaner-fuentes.helper.ts
    - tests/helpers/comentarios.helper.ts
    - tests/helpers/types/importacion.type.ts
    - tests/helpers/types/comentarios.type.ts
    - web/src/styles/tokens.css
    - web/src/styles/global.css
    - web/src/components/icons/iconos.tsx
    - web/src/components/aviso.tsx
    - web/src/components/aviso.module.css
    - web/src/types/ui.type.ts
  modified:
    - tests/architecture.test.ts
    - tests/sin-comentarios.test.ts
    - .claude/CLAUDE.md
    - docs/estructura.md
    - web/src/main.tsx
    - web/src/app.tsx
    - web/src/config/constants/ui.constants.ts

key-decisions:
  - "Los escáneres de architecture.test.ts y sin-comentarios.test.ts pasan a tests/helpers para que el guardián web use exactamente la misma lectura; importar un archivo de prueba desde otro registraría sus tests dos veces"
  - "El texto JSX se detecta transpilando con Bun.Transpiler en lugar de una regex sobre > y <, que daba falsos positivos con genéricos y flechas"
  - "Se suma W13 (carpetas de rol y sufijos de web/src) para que la regla de CLAUDE.md sobre main.tsx y app.tsx como únicos sueltos tenga guardián"
  - "Biome normaliza los hex a minúsculas en tokens.css (--acento: #1f5fbf); es el mismo color que #1F5FBF de la UI-SPEC"
  - "Ante ERROR_HTTP o ERROR_RED el servidor no corrió el turno, así que el borrador vuelve al compositor si está vacío; ante FIN_STREAM no, porque el turno pudo correr"

patterns-established:
  - "Todo componente nuevo de web/ nace bajo W1-W13: textos en web/src/config/strings.ts, tipos en web/src/types, estilos por tokens y archivos en su carpeta de rol"
  - "Íconos siempre por componente de iconos.tsx, con aria-hidden y acompañados de texto"

requirements-completed: [UI-04]

coverage:
  - id: D1
    description: "El guardián web revisa el código real de web/src (no vacío: encuentra app.tsx, conversacion.ts, un archivo de tipos y aviso.module.css) y no reporta nada"
    requirement: "UI-04"
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#guardián de web/ sobre el código real"
        status: pass
    human_judgment: false
  - id: D2
    description: "Cada regla W1-W13 muerde sobre una fuente de muestra (relativos, paquetes, alias @/, estado puro, innerHTML, import.meta.env, almacenamiento, texto en literales y JSX, enum, tipos, regex, CSS con hex/rgb/px, ubicación)"
    requirement: "UI-04"
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#el guardián de web/ muerde sobre fuentes de muestra"
        status: pass
    human_judgment: false
  - id: D3
    description: "sin-comentarios recorre web/ (TS, TSX, CSS e index.html, sin web/dist) y muerde con comentarios de JSX, CSS y HTML"
    requirement: "UI-04"
    verification:
      - kind: unit
        ref: "tests/sin-comentarios.test.ts#el escáner de web/ muerde sobre fuentes de muestra"
        status: pass
    human_judgment: false
  - id: D4
    description: "Con un error forzado del proveedor, el aviso se ve en rojo con el ícono de alerta y el texto del servidor, y el textarea acepta el siguiente mensaje"
    requirement: "UI-04"
    verification:
      - kind: automated_ui
        ref: "Pendiente: Playwright MCP del orquestador contra bun run dev con una clave falsa"
        status: pending
    human_judgment: true
    rationale: "El color, el ícono y la legibilidad del aviso son visuales; el contrato del reductor (error guardado, turno cerrado) ya lo cubren las pruebas de 03-03"

duration: 9min
completed: 2026-10-15
status: complete
---

# Phase 3 Plan 05: Guardián de web/ y sistema de diseño Summary

**web/ queda guardado por W1-W13 (sin relativos, solo react/react-dom/eventsource-parser, @/ solo a config pura y a tipos http, sin innerHTML ni import.meta.env, textos solo en strings.ts también en JSX, CSS solo con tokens) y recibe los tokens de la UI-SPEC, los nueve íconos y AvisoError/AvisoSistema. El error de cada turno se muestra como alerta accesible.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-15T00:11:34Z
- **Completed:** 2026-10-15T00:20:00Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments

- `tests/arquitectura-web.test.ts` tiene 13 reglas. Cada una tiene una prueba sobre el código real y otra que demuestra que muerde con una muestra en línea. Para el texto JSX se usa `Bun.Transpiler`, así el texto entre etiquetas pasa por el mismo detector que G8.
- `tests/sin-comentarios.test.ts` ahora cubre `web/**/*.{ts,tsx,css}` y `web/index.html`, con escáneres propios para CSS (`/* */` fuera de cadenas) y para HTML (`<!--`).
- Los escáneres compartidos se movieron a `tests/helpers/escaner-fuentes.helper.ts` y `tests/helpers/comentarios.helper.ts`, sin cambiar el comportamiento: G1-G16 siguen en verde.
- `tokens.css` declara todos los tokens de la UI-SPEC: espaciado de 4 a 64 px, los cuatro roles tipográficos, los colores dominante, secundario, acento y destructivo, neutros y semánticos, radios, bordes, tamaños fijos, foco y fuentes. `global.css` arma el layout de `100dvh` sin scroll del `body` (el `main` hace scroll propio) y define `.sr-only`, `.transicion`, `.girar` y el modo de movimiento reducido.
- `AvisoError` (`role="alert"`, paleta de error, ícono de alerta) y `AvisoSistema` (`role="status"`, paleta informativa, ícono info) pintan el mensaje como texto `pre-wrap` con `overflow-wrap: anywhere`, y dejan un espacio de acciones para el plan 03-26.
- `app.tsx` muestra el error del turno con `AvisoError`. El textarea nunca se deshabilita, y si el servidor rechazó el pedido o la red cayó, el borrador vuelve al compositor.

## Task Commits

1. **Task 1: El guardián web y sus reglas llegan antes de que crezca la UI** - `33f2d75` (test)
2. **Task 2: Tokens, íconos y avisos de la UI-SPEC, con el error del turno como AvisoError (UI-04)** - `891428a` (feat)

## Files Created/Modified

- `tests/arquitectura-web.test.ts`: guardián W1-W13 del front.
- `tests/helpers/escaner-fuentes.helper.ts` y `tests/helpers/types/importacion.type.ts`: escáneres de importaciones (con `import type`), literales, regex, enums y tipos.
- `tests/helpers/comentarios.helper.ts` y `tests/helpers/types/comentarios.type.ts`: escáneres de comentarios de TS/TSX, CSS y HTML.
- `tests/architecture.test.ts` y `tests/sin-comentarios.test.ts`: usan los helpers. sin-comentarios también recorre web/.
- `.claude/CLAUDE.md`: bloque "Front web" y alias `@web/`. La línea de guardianes ahora menciona W1-W13.
- `docs/estructura.md`: sección "Front web (`web/`)" y nota sobre los escáneres compartidos.
- `web/src/styles/tokens.css` y `web/src/styles/global.css`: el sistema de diseño.
- `web/src/components/icons/iconos.tsx`: los nueve íconos.
- `web/src/components/aviso.tsx` y `aviso.module.css`: `AvisoError` y `AvisoSistema`.
- `web/src/types/ui.type.ts`: `TamanoIcono`, `PropsIcono`, `PropsSvgIcono` y `PropsAviso`.
- `web/src/config/constants/ui.constants.ts`: `TAMANO_ICONO`, `ICONO_SVG`, `CLASE_GLOBAL` y `ACCIONES_QUE_DEVUELVEN_EL_BORRADOR`.
- `web/src/main.tsx`: importa `tokens.css` y `global.css`.
- `web/src/app.tsx`: `AvisoError` para el error del turno y devolución del borrador.

## Decisions Made

Ver `key-decisions` en el frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Escáneres compartidos en tests/helpers**
- **Found during:** Task 1
- **Issue:** el plan pide reutilizar `extraerImportaciones`, `literalesDeTexto`, `encontrarComentarios` y compañía, pero viven dentro de archivos de prueba. Importar un `*.test.ts` desde otro registraría sus tests dos veces.
- **Fix:** se movieron sin cambios de lógica a `tests/helpers/escaner-fuentes.helper.ts` y `tests/helpers/comentarios.helper.ts`, con sus tipos en `tests/helpers/types/`. Se agregó `extraerImportacionesConTipo` para distinguir `import type`.
- **Files modified:** tests/architecture.test.ts, tests/sin-comentarios.test.ts y los cuatro archivos nuevos de helpers.
- **Commit:** 33f2d75

**2. [Rule 2 - Missing Critical] W13: carpetas de rol de web/src**
- **Found during:** Task 1
- **Issue:** el bloque "Front web" de CLAUDE.md (que pide el plan) dice que `main.tsx` y `app.tsx` son los únicos sueltos, pero ninguna regla del guardián lo comprobaba.
- **Fix:** W13 valida la carpeta y el sufijo de cada archivo de web/src, con su prueba de violación.
- **Commit:** 33f2d75

**3. [Rule 2 - Missing Critical] El borrador vuelve al compositor si el servidor no corrió el turno**
- **Found during:** Task 2 (seguimiento de 03-03)
- **Issue:** la UI-SPEC pide que, ante un 413/429/503, el texto escrito no se pierda. `app.tsx` vaciaba el borrador al enviar.
- **Fix:** ante `ERROR_HTTP` o `ERROR_RED` el mensaje vuelve al textarea si está vacío, y no pisa lo que la analista ya empezó a escribir.
- **Files modified:** web/src/app.tsx, web/src/config/constants/ui.constants.ts
- **Commit:** 891428a

**4. [Rule 3 - Blocking] Tipos de props en web/src/types/ui.type.ts**
- **Found during:** Task 2
- **Issue:** W10 exige que los tipos exportados vivan en `web/src/types/*.type.ts`, y el plan no listaba un archivo de tipos para íconos y avisos.
- **Fix:** se creó `web/src/types/ui.type.ts`.
- **Commit:** 891428a

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 missing critical)
**Impact on plan:** ningún cambio de alcance ni dependencia nueva. `web/src/config/strings.ts` no cambió, porque los avisos no tienen copia propia: muestran el texto del servidor o la copia de red y stream que ya existía.

## Issues Encountered

- Biome pasa los hex de `tokens.css` a minúsculas. El criterio "`--acento` con `#1F5FBF`" se cumple sin distinguir mayúsculas (`--acento: #1f5fbf`).
- Se probó una prueba de render (`renderToStaticMarkup`) para `AvisoError`. Pasaba en `bun test`, pero el `tsc` raíz no tiene `jsx` ni tipos para `*.module.css`, así que se retiró para no tocar `tsconfig.json`. El plan que introduzca pruebas de componentes (03-07 o posterior) puede sumar `jsx` y una declaración de módulos CSS al tipado de `tests/`.
- El caso con un `import("../c.ts")` literal dentro de la muestra de W1 activaba G1. Se resolvió armando la comilla en una variable, como hace architecture.test.ts.

## Verificación

- `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts tests/web/conversacion.test.ts tests/architecture.test.ts`: 117 pass, 0 fail.
- `bun test` completo: 1651 pass, 1 skip (prueba en vivo existente), 0 fail.
- `bun run build:web`: OK. El CSS del bundle trae `--acento:#1f5fbf`.
- `bun run check` (tsc raíz, tsc web, biome y audit): exit 0.
- `grep -cE "#[0-9A-Fa-f]{3,8}" web/src/components/aviso.module.css` → 0. `aviso.tsx` contiene `role="alert"` y `role="status"`.
- **Pendiente visual (human-check del plan):** forzar un error del proveedor y comprobar el aviso rojo con ícono y que el textarea acepte el siguiente mensaje. Lo corre el orquestador con Playwright MCP. Hasta que llegue la pantalla de acceso (03-10), cualquier mensaje desde el navegador recibe el 401 de acceso vencido, que también se pinta como `AvisoError`.

## Seguimientos que quedan fuera de este plan

- `/favicon.ico` sigue respondiendo 404. Toca `web/index.html` o los estáticos, que corresponden a 03-07 o 03-09.

## User Setup Required

None.

## Next Phase Readiness

- Los componentes de 03-07 en adelante nacen bajo W1-W13 y consumen `tokens.css`, los íconos y los avisos.
- 03-26 puede agregar los botones "Recargar conversación" y "Empezar sesión nueva" en el espacio `acciones` de `AvisoError`.
- 03-25 debe crear `web/src/api/sesion-local.ts`, que es el único módulo donde W7 permite `localStorage`.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED

- Los 11 archivos creados existen en disco.
- Los commits 33f2d75 y 891428a son ancestros de HEAD.
