---
phase: 03-chat-web-api-sse-y-despliegue
plan: 37
subsystem: ui
tags: [react, css-modules, a11y, responsive, sr-only]

requires:
  - phase: 03-36
    provides: "Seguimiento del final por intención de la usuaria e 'Ir al final' solo con ícono a 375; tipos de seguimiento en ui.type.ts"
  - phase: 03-34
    provides: "AccionesRapidas con la prop deshabilitadas"
  - phase: 03-33
    provides: "Etiqueta 'Sin clave válida' del estado del modelo"
provides:
  - "TEXTO_APP.prefijoFecha y valorFecha; TEXTO_MODELO.prefijoModelo y etiqueta (los textos completos se arman con ellos)"
  - "TEXTO_ACCIONES.demoCorto y todosCorto(n); demo y todos(n) se derivan de ellas"
  - "PropsEncabezado.angosto, PropsEstadoDelModelo.angosto y PropsAccionesRapidas.angosto"
  - "Encabezado en dos líneas a 375 con los prefijos sr-only y la fila meta sin partir"
  - "Franja compacta de chips con etiquetas cortas y aria-label completo a 375, sin scroll horizontal"
affects: [03-38, 03-39, ui-review, verify-work]

actuals:
  tokens: 3520
  tasks: 2
  commits: 2
plan_head_before: 84f3c428c66766a6d8edbb70b87fb9ab6e63bdfc
plan_head_after: e7c939e3a56d5d29a6a6760d35c6515b54ceec07

tech-stack:
  added: []
  patterns:
    - "Texto partido en prefijo + valor: el prefijo se oculta con CLASE_GLOBAL.OCULTO en angosto y queda para lectores de pantalla"
    - "Prefijo y valor van dentro de un único span inline para que el espacio final del prefijo no se colapse dentro del contenedor inline-flex"
    - "Etiqueta corta visible + aria-label con el nombre completo, mismo mensaje enviado"

key-files:
  created: []
  modified:
    - web/src/config/strings.ts
    - web/src/types/ui.type.ts
    - web/src/components/encabezado.tsx
    - web/src/components/encabezado.module.css
    - web/src/components/acciones-rapidas.tsx
    - web/src/components/acciones-rapidas.module.css
    - web/src/app.tsx
    - tests/web/estado-del-modelo.test.ts
    - tests/web/acciones-rapidas.test.ts

key-decisions:
  - "Prefijo y valor de la fecha y del modelo van en un span .texto común: en un contenedor inline-flex cada hijo es un flex item y el espacio final del prefijo se perdía en ancho"
  - "En angosto el texto de fecha y modelo lleva elipsis (nowrap + overflow hidden) para que la fila meta no se parta ni desborde con etiquetas largas como 'Sin clave válida'"
  - "TEXTO_ACCIONES.todos(n) se deriva de todosCorto(n) ('Procesar ' + 'los {n} casos'), así la etiqueta corta siempre está contenida en la completa"
  - "El estado vacío recibe angosto={false}: no usa la franja compacta y no cambia"

patterns-established:
  - "Prefijo sr-only en angosto: abreviar texto visible sin perder el nombre accesible completo"

requirements-completed: [UI-09, UI-07, UI-01]

coverage:
  - id: D1
    description: "Los textos completos de fecha y estado del modelo se arman con prefijo + valor y no cambian ('Fecha de ejecución 2026-09-03', 'deepseek-flash · Disponible')"
    requirement: UI-09
    verification:
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts#el prefijo del modelo y la etiqueta arman el texto completo de cada estado"
        status: pass
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts#el prefijo de la fecha y su valor arman 'Fecha de ejecución {fecha}'"
        status: pass
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts#cada estado se lee como '{modelo} · {estado}' con la etiqueta del UI-SPEC"
        status: pass
    human_judgment: false
  - id: D2
    description: "Etiquetas cortas de los chips ('Demo §11', 'Los {n} casos') contenidas en su nombre completo, con aria-label completo y el mismo mensaje enviado"
    requirement: UI-07
    verification:
      - kind: unit
        ref: "tests/web/acciones-rapidas.test.ts#las etiquetas cortas de la franja angosta salen de su nombre completo"
        status: pass
      - kind: unit
        ref: "tests/web/acciones-rapidas.test.ts#el chip corto manda el mismo mensaje y conserva el nombre completo como aria-label"
        status: pass
    human_judgment: false
  - id: D3
    description: "A 375×667 tras la demo de 4 casos: encabezado < 100 px en dos líneas, franja de chips <= 57 px en una fila, línea de tiempo >= 250 px, sin scroll horizontal ni del documento; a 1280×720 encabezado y chips sin cambios visibles; el árbol de accesibilidad lee 'Fecha de ejecución 2026-09-03' y 'Procesar los 4 casos'"
    requirement: UI-01
    verification: []
    human_judgment: true
    rationale: "Medidas de layout y árbol de accesibilidad en navegador real (receta T16 con Playwright MCP, human-check de la tarea 2); no hay prueba automatizada de layout en la suite y el executor no tiene Playwright MCP"

duration: 3min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 37: Encabezado y chips compactos a 375 Summary

**A 375 el encabezado pasa a dos líneas con la fecha ('2026-09-03') y el estado del modelo ('● Disponible') abreviados mediante prefijos sr-only, y la franja compacta de chips cabe en una fila con 'Demo §11', 'Los 4 casos' y '¿Qué casos hay?' manteniendo el aria-label completo y flex-wrap sin scroll horizontal (G-03-04)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-15T17:43:05Z
- **Completed:** 2026-10-15T17:46:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- `TEXTO_APP.fechaEjecucion` y `TEXTO_MODELO.estado` se arman ahora con `prefijoFecha` + `valorFecha` y `prefijoModelo` + `etiqueta`, y devuelven exactamente el texto de antes.
- Con `angosto`, `Encabezado` oculta visualmente los prefijos (`CLASE_GLOBAL.OCULTO`). La fila meta (fecha, modelo y "Nueva sesión") no se parte: usa nowrap, `min-width: 0` en los hijos y elipsis en el texto.
- Con `compactas && angosto`, `AccionesRapidas` pinta "Demo §11" y "Los {n} casos" con `aria-label` igual al nombre completo y manda el mismo mensaje. El chip de listar no cambia.
- `app.tsx` pasa `angosto={diseno === DISENO.ANGOSTO}` al encabezado y a la franja compacta. El estado vacío recibe `angosto={false}` y no cambia.

## Task Commits

1. **Task 1 (tracer): encabezado en dos líneas a 375 sin perder el texto accesible**: `20edbd6` (feat). RED primero, con las filas de composición fallando por `valorFecha is not a function`.
2. **Task 2: chips compactos en una fila a 375 sin scroll horizontal**: `e7c939e` (feat). RED primero, con 2 pruebas fallando.

Tracer feedback gate: modo interactivo end-of-phase y `<verify>` solo automatizado, así que se volvió a correr `bun test tests/web/estado-del-modelo.test.ts tests/web/conversacion.test.ts tests/arquitectura-web.test.ts` (86 pass, 0 fail) antes de expandir.

## Files Created/Modified

- `web/src/config/strings.ts`: `PREFIJO_FECHA`, `valorFecha`, `prefijoDelModelo` y `etiquetaDelModelo`. También `DEMO_CORTO` y `losCasos(n)`, de los que se derivan `demo` y `todos(n)`.
- `web/src/types/ui.type.ts`: `angosto` en `PropsEncabezado`, `PropsEstadoDelModelo` y `PropsAccionesRapidas`.
- `web/src/components/encabezado.tsx`: prefijo y valor dentro de un span `.texto`, con el prefijo sr-only en angosto.
- `web/src/components/encabezado.module.css`: `.texto`, y en angosto `.meta` con nowrap, `.meta > *` con `min-width: 0` y `.texto` con elipsis.
- `web/src/components/acciones-rapidas.tsx`: etiqueta corta y `aria-label` completo cuando `corta`.
- `web/src/components/acciones-rapidas.module.css`: en angosto, `.franja .chip` usa `padding-inline: var(--espacio-sm)`. No hay `overflow-x`.
- `web/src/app.tsx`: pasa `angosto` al encabezado y a las dos instancias de `AccionesRapidas`.
- `tests/web/estado-del-modelo.test.ts`: filas de composición de prefijo y valor para cada estado del modelo y para la fecha (también con `null`).
- `tests/web/acciones-rapidas.test.ts`: copia de las etiquetas cortas, su contención en el nombre completo (0, 1 y 4 casos), el `aria-label` completo y un único `alEnviar` por mensaje.

## Decisions Made

- Prefijo y valor van dentro de un único span inline. `.fecha` y `.modelo` son inline-flex, así que cada hijo directo sería un flex item y el espacio final de "Fecha de ejecución " o "deepseek-flash · " se colapsaría en el diseño ancho.
- En angosto se pone elipsis sobre `.texto` para que una etiqueta larga ("Sin clave válida") no parta la fila meta ni cause scroll horizontal.
- `todos(n)` se deriva de `todosCorto(n)`, siguiendo la regla de derivar el texto que repite un dato. Así la etiqueta corta siempre está contenida en la completa.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Espacio del prefijo colapsado dentro del contenedor inline-flex**
- **Found during:** Task 1
- **Issue:** el plan pedía pintar el prefijo en un span y el valor aparte como hijos del chip. `.fecha` y `.modelo` son `inline-flex`, así que el espacio final del prefijo se pierde entre flex items y en ancho se vería "Fecha de ejecución2026-09-03".
- **Fix:** prefijo y valor quedan envueltos en un span `.texto` (un solo flex item), y el prefijo sigue siendo su propio span.
- **Files modified:** web/src/components/encabezado.tsx, web/src/components/encabezado.module.css
- **Verification:** las pruebas de composición pasan. La comprobación visual queda en el human-check de T16.
- **Committed in:** 20edbd6

**2. [Rule 3 - Blocking] Formato de Biome en acciones-rapidas.tsx**
- **Found during:** Task 2
- **Issue:** `bun run check` salió con exit 1 porque la firma de `AccionesRapidas` con 5 props superaba el ancho de línea.
- **Fix:** se corrió `biome format --write` sobre el archivo y `bun run check` volvió a exit 0.
- **Files modified:** web/src/components/acciones-rapidas.tsx
- **Committed in:** e7c939e

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** ninguno de alcance. Los dos eran necesarios para que el texto se vea igual en ancho y para que el gate de check pase.

## Issues Encountered

None.

## Verification

- `bun test tests/web/estado-del-modelo.test.ts tests/web/conversacion.test.ts tests/arquitectura-web.test.ts`: 86 pass, 0 fail.
- `bun test tests/web`: 265 pass, 0 fail.
- `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts`: 38 pass, 0 fail.
- `bun run build:web`: exit 0.
- `bun run check`: exit 0, con tsc, tsc web, Biome y audit.
- `bun test` completo: 2226 pass, 1 skip, 0 fail.
- Criterios de aceptación: `grep prefijoFecha|prefijoModelo encabezado.tsx` da 2 líneas, `grep angosto app.tsx` muestra la línea del encabezado, `grep demoCorto|todosCorto acciones-rapidas.tsx` da 2 líneas y `grep overflow-x acciones-rapidas.module.css` no imprime nada.
- Pendiente (human-check end-of-phase): receta T16 con Playwright MCP a 375×667 y 1280×720. Mide el alto del encabezado (< 100 px), de la franja (<= 57 px) y de la línea de tiempo (>= 250 px), comprueba que no haya scroll del documento y lee el árbol de accesibilidad.

## User Setup Required

None. No hace falta configurar servicios externos.

## Next Phase Readiness

- Queda lista la parte de alto a 375 de G-03-04. G-03-04 se cierra del todo con 03-35, 03-36 y 03-38.
- 03-39 tiene que reconciliar la UI-SPEC (L100 dice scroll horizontal en los chips, pero la usuaria decidió flex-wrap sin scroll).

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED

- Commits 20edbd6 y e7c939e presentes en HEAD.
- Archivos modificados presentes; SUMMARY en disco.
