---
phase: 03-chat-web-api-sse-y-despliegue
plan: 22
subsystem: ui
tags: [react, css-modules, progreso, pestanas, responsive, a11y]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-21: resultadosPorCaso y la tarjeta de resultado; 03-19: tarjetas de herramienta; 03-16: caso en tool_start, tool_end y confirmation_required"
provides:
  - "progresoPorCaso({ turnos, enCurso }) y firmaDelProgreso en web/src/state/casos.ts"
  - "ProgresoCaso (seis etapas con aria-label completo) y PanelCasos (estado vacío, bloque reciente expandido, pie del disco temporal)"
  - "Dos columnas desde 1024 px; pestañas Chat / Casos y archivos con punto de cambios sin ver por debajo; encabezado partido bajo 640 px"
  - "TurnoConversacion.confirmaciones: cada confirmation_required queda en su turno con la posición en que llegó"
  - "useDiseno (data-diseno en la raíz de la app) y usePestanas"
affects: [03-23, 03-25, 03-27]

actuals:
  tokens: 13510
  tasks: 2
  commits: 3
plan_head_before: 630c8016737d257a7a15923c8c515ea9a7c94718
plan_head_after: 6a279790770ada49fc1c0a9ec3434b398aea96e4

tech-stack:
  added: []
  patterns:
    - "Puntos de quiebre en un solo lugar (PUNTO_DE_QUIEBRE_PX en ui.constants.ts): useDiseno los lee con matchMedia y marca data-diseno en .app; los módulos CSS reaccionan con :global([data-diseno=\"angosto\"]) .clase, sin px sueltos"
    - "El progreso se pliega solo de eventos de herramientas y de confirmation_required, en el orden en que llegaron dentro del turno (trasLlamadas)"

key-files:
  created:
    - web/src/components/progreso-caso.tsx
    - web/src/components/progreso-caso.module.css
    - web/src/components/panel-casos.tsx
    - web/src/components/panel-casos.module.css
    - web/src/hooks/usar-diseno.ts
    - web/src/hooks/usar-pestanas.ts
    - tests/web/progreso.test.ts
  modified:
    - web/src/state/casos.ts
    - web/src/state/conversacion.ts
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - web/src/app.tsx
    - web/src/styles/global.css
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/components/icons/iconos.tsx
    - web/src/components/encabezado.tsx
    - web/src/components/encabezado.module.css
    - web/src/components/tarjeta-herramienta.module.css
    - web/src/components/mensaje.module.css
    - web/src/components/compositor.module.css

key-decisions:
  - "Los puntos de quiebre viven solo en ui.constants.ts y el CSS responde a data-diseno, en vez de media queries en px dentro de global.css: W12 prohíbe px en los módulos y así no hay dos fuentes que puedan desalinearse"
  - "Un simular_envio con ok marca hecha la etapa 6 y también la 5 (la compuerta del servidor solo deja enviar con autorización); 03-23 completa la etapa 5 desde las tarjetas y agrega cancelada"
  - "Un tool_start sin tool_end solo marca en curso mientras su turno corre; si el turno se cortó, la etapa conserva su estado anterior"
  - "La confirmation_required que el servidor repite en cada cierre de turno solo cuenta como actividad si cambia la etapa 5; si no, el caso que ya esperaba saltaría al primer lugar del panel"
  - "Un tool_end con ok false marca su etapa en error y no toca las demás; solo un armar_paquete con ok reinicia las etapas 5 y 6 (D-63.4)"

patterns-established:
  - "Diseño por atributo: :global([data-diseno=\"angosto\"]) .clase en los módulos CSS"
  - "Pestañas accesibles: tablist con flechas, Inicio y Fin, tabIndex itinerante y tabpanel con hidden solo cuando hay pestañas"

requirements-completed: [UI-08]

coverage:
  - id: D1
    description: "progresoPorCaso pliega las seis etapas por caso solo desde tool_start, tool_end y confirmation_required: hechas en orden, error, en curso, esperando, reinicio de 5 y 6 tras un armar_paquete nuevo y turno cortado"
    requirement: "UI-08"
    verification:
      - kind: unit
        ref: "tests/web/progreso.test.ts#las seis etapas del progreso por caso (UI-08)"
        status: pass
      - kind: unit
        ref: "tests/web/progreso.test.ts#el texto del agente nunca marca una etapa (T-03-42)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Orden del panel: el caso con actividad más reciente primero y el resto por primera aparición; la confirmación repetida no reordena"
    requirement: "UI-08"
    verification:
      - kind: unit
        ref: "tests/web/progreso.test.ts#orden de los casos en el panel"
        status: pass
    human_judgment: false
  - id: D3
    description: "Textos de las etapas (aria-label 'Mapeado: hecho'), del panel vacío y del pie, según el contrato de copia"
    requirement: "UI-08"
    verification:
      - kind: unit
        ref: "tests/web/progreso.test.ts#textos del progreso y del panel"
        status: pass
      - kind: other
        ref: "bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts && bun run build:web && bun run check"
        status: pass
    human_judgment: false
  - id: D4
    description: "Diseño a 1280, 800 y 375 px: dos columnas con panel de 384 px; pestañas con punto de cambios sin ver; encabezado partido; sin desborde horizontal ni solapes"
    requirement: "UI-08"
    verification:
      - kind: automated_ui
        ref: "chrome-headless-shell por CDP con el LLM falso de 03-19: scrollWidth igual al ancho en 1280, 800 y 375; panel 384 px; tablist desde 1023 px; punto tras un turno; flecha derecha cambia de pestaña"
        status: pass
    human_judgment: true
    rationale: "El aspecto visual (que nada se vea apretado o solapado) lo confirma el orquestador con Playwright; la medición automática solo prueba el ancho del documento y los elementos que salen del viewport"

duration: 12min
completed: 2026-10-15
status: complete
---

# Phase 3 Plan 22: Progreso por caso y pantallas angostas Summary

**Panel lateral con las seis etapas de cada caso, armado solo con eventos de herramientas y confirmation_required, más pestañas "Chat / Casos y archivos" bajo 1024 px y un encabezado que se parte bajo 640 px sin scroll horizontal**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-15T04:38:05Z
- **Completed:** 2026-10-15T04:49:45Z
- **Tasks:** 2 (más un fix de la tarea 1)
- **Files modified:** 21

## Accomplishments

- `progresoPorCaso` pliega por caso las etapas Leído, Mapeado, Generado, Paquete, Confirmación y Envío. Lee solo `tool_start`, `tool_end` (ok o error) y `confirmation_required`, nunca el texto del agente (T-03-42: `grep -c "TIPO_EVENTO.TEXTO" web/src/state/casos.ts` da 0). Un `armar_paquete` nuevo con ok reinicia las etapas 5 y 6 (D-63.4).
- `ProgresoCaso` muestra la lista ordenada con un ícono de 16 px, una etiqueta de 14 px y un `aria-label` completo por etapa ("Mapeado: hecho"). En pantallas angostas la lista pasa a vertical. `PanelCasos` muestra "Casos de esta sesión", el estado vacío, un `<details>` por caso con el más reciente expandido y el pie fijo del disco temporal.
- Desde 1024 px hay dos columnas: el chat flexible y el panel de 384 px, cada uno con su propio scroll. Por debajo aparece la barra de pestañas de 40 px (`role="tablist"`, `aria-selected`, flechas, Inicio y Fin) con el punto de acento de 8 px cuando el panel cambió desde la última vez que se vio.
- Bajo 640 px el encabezado pone el título arriba y la fecha y el modelo debajo (los chips se compactan), las burbujas ocupan todo el ancho y el compositor usa 16 px de padding.
- Se corrigió lo que el orquestador vio a 375 px después de 03-21. El documento medía 507 px y ahora mide 375. Las filas de las tarjetas de herramienta encogen la etiqueta y el caso con elipsis, y el resumen pasa a su propia línea.

## Task Commits

1. **Task 1: Tracer, el panel con el progreso de seis etapas (UI-08)**: `cef8a48` (feat)
2. **Fix de la tarea 1: la confirmación repetida no reordena el panel**: `b27c685` (fix)
3. **Task 2: Pestañas entre 640 y 1023 px y encabezado partido bajo 640 px**: `6a27979` (feat)

Tracer: el `<verify>` era solo automático (modo end-of-phase) y pasó completo. `⚡ Tracer verified end-to-end — expanding`.

## Files Created/Modified

- `web/src/state/casos.ts`: `progresoPorCaso`, el plegado por caso con primera aparición y última actividad, y `firmaDelProgreso` para el punto de cambios sin ver.
- `web/src/state/conversacion.ts` y `web/src/types/chat.type.ts`: `confirmation_required` queda en `TurnoConversacion.confirmaciones` con `trasLlamadas`, que es la posición en que llegó dentro del turno. Se suman los tipos `Etapa`, `EstadoEtapa`, `EtapaDeCaso` y `ProgresoDeCaso`.
- `web/src/components/progreso-caso.tsx` y `.module.css`, y `web/src/components/panel-casos.tsx` y `.module.css`: los componentes nuevos.
- `web/src/components/icons/iconos.tsx`: `IconoPendiente`, el círculo hueco de la etapa pendiente.
- `web/src/hooks/usar-diseno.ts` y `web/src/hooks/usar-pestanas.ts`: el diseño por ancho (`useSyncExternalStore` sobre `matchMedia`) y la pestaña elegida con los cambios sin ver.
- `web/src/app.tsx`: la raíz `.app[data-diseno]`, las dos columnas, la barra de pestañas y los `tabpanel`.
- `web/src/styles/global.css`: el layout de columnas, las vistas ocultas, la barra de pestañas y el punto de cambios.
- `web/src/config/constants/ui.constants.ts`: `ETAPA`, `ORDEN_ETAPAS`, `ETAPA_DE_HERRAMIENTA`, `ESTADO_ETAPA`, `PUNTO_DE_QUIEBRE_PX`, `CONSULTA_DE_ANCHO`, `DISENO`, `PESTANA`, `TECLA_PESTANA` y las clases globales.
- `web/src/config/strings.ts`: `TEXTO_PROGRESO`, `TEXTO_PANEL` y `TEXTO_PESTANAS`.
- `web/src/components/encabezado.tsx` y `.module.css`, `tarjeta-herramienta.module.css`, `mensaje.module.css` y `compositor.module.css`: las reglas para pantallas angostas y la corrección del desborde.
- `tests/web/progreso.test.ts`: 20 pruebas puras.

## Decisions Made

Ver `key-decisions` en el frontmatter. Lo principal:
- Los puntos de quiebre viven solo en TypeScript (`PUNTO_DE_QUIEBRE_PX`) y el CSS responde a `data-diseno`.
- Un `simular_envio` con ok cierra también la etapa 5. 03-23 la hará depender de las tarjetas y agregará `cancelada`.
- Un turno cortado no deja ninguna etapa en curso.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] La confirmación repetida en cada cierre de turno movía al caso equivocado al primer lugar**
- **Found during:** verificación en el navegador después de la tarea 2.
- **Issue:** `cerrarTurnoConCompuerta` vuelve a emitir `confirmation_required` por cada caso pendiente al cerrar cada turno. El plegado lo contaba como actividad, así que después de procesar pe-andes el panel seguía mostrando primero a co-industrias-delta.
- **Fix:** la confirmación solo cuenta como actividad si cambia la etapa 5 (`registrarConfirmacion`). Se agregó una prueba.
- **Files modified:** web/src/state/casos.ts, tests/web/progreso.test.ts
- **Verification:** `bun test tests/web/progreso.test.ts` (20 pass). En el navegador el orden quedó pe-andes, ec, co.
- **Committed in:** b27c685

**2. [Rule 1 - Bug] Desborde horizontal a 375 px (hallazgo del orquestador)**
- **Found during:** tarea 2.
- **Issue:** el encabezado no se partía y las filas de las tarjetas de herramienta tenían la etiqueta y el badge con `flex: none`, así que el documento medía 507 px de ancho.
- **Fix:** el encabezado ahora se envuelve, con la fecha y el modelo en un grupo `.meta`. La etiqueta y el caso encogen con elipsis, y en pantallas angostas el resumen pasa a otra línea y se oculta si está vacío.
- **Files modified:** web/src/components/encabezado.tsx, encabezado.module.css, tarjeta-herramienta.module.css (fuera de `files_modified`)
- **Verification:** por CDP, scrollWidth da 375, 800 y 1280 en cada ancho y ningún elemento visible sale del viewport.
- **Committed in:** 6a27979

**3. [Rule 3 - Blocking] Archivos fuera de la lista del plan que exigen los guardianes**
- **Issue:** W10 exige que las props exportadas vivan en `web/src/types/ui.type.ts`. El estado pendiente necesita un ícono de círculo hueco, que no estaba en el set. Los hooks de diseño y de pestañas necesitan su propio archivo en `web/src/hooks/`.
- **Fix:** se tocaron `ui.type.ts`, `iconos.tsx` (`IconoPendiente`), `usar-diseno.ts`, `usar-pestanas.ts`, `mensaje.module.css` y `compositor.module.css`.
- **Committed in:** cef8a48, 6a27979

**4. [Desvío de forma] Sin media queries en px en global.css**
- **Issue:** el plan pedía que global.css usara media queries con los valores de los tokens. Las variables CSS no funcionan dentro de `@media`, y W12 prohíbe px en los módulos.
- **Fix:** un solo origen para los puntos de quiebre (`ui.constants.ts`). `useDiseno` marca `data-diseno` y global.css y los módulos seleccionan sobre ese atributo. El resultado visible es el mismo que pide el plan.

---

**Total deviations:** 4 (2 bugs, 1 bloqueante, 1 de forma).
**Impact on plan:** todos eran necesarios para que el panel fuera correcto y para cumplir los guardianes. No hay alcance nuevo.

## Issues Encountered

- A 375 px el encabezado ocupa unos 137 px (cuatro filas: título, subtítulo, fecha y modelo). Los dos chips no caben juntos en 343 px con la copia del contrato. No hay solape ni scroll horizontal.
- En la primera pasada de Biome, `noDescendingSpecificity` marcó `.vista-chat > main` contra `#root > main`. Se resolvió dándole a `<main>` la clase global `chat`.

## Verification

- `bun test tests/web/progreso.test.ts tests/arquitectura-web.test.ts`: pasa (20 pruebas nuevas).
- `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts tests/web`: 155 pass.
- `bun --env-file=/dev/null test`: 2005 pruebas, 0 fail, 1 skip.
- `bun run build:web` y `bun run check` (tsc, tsc web, Biome sin advertencias, bun audit): pasan.
- Criterios de aceptación: `grep -c "TIPO_EVENTO.TEXTO" web/src/state/casos.ts` da 0; `progreso-caso.tsx` pone `aria-label` por etapa; `app.tsx` contiene `role="tablist"` y `aria-selected`; la prueba del reinicio de las etapas 5 y 6 está en `tests/web/progreso.test.ts`.
- Revisión en el navegador (chrome-headless-shell por CDP, servidor local en el puerto 3022 con `--env-file=/dev/null` y el LLM falso de 03-19 en el 4022; los procesos quedaron detenidos):
  - 1280×720: `tablist` ausente, panel de 384 px y scrollWidth de 1280.
  - 800×720: pestañas presentes, panel a todo el ancho al elegir "Casos y archivos", punto de cambios tras un turno visto desde Chat y scrollWidth de 800.
  - 375×667: pestañas, encabezado partido, etapas en vertical y scrollWidth de 375.

## Next Phase Readiness

- 03-23 puede leer `TurnoConversacion.confirmaciones` y `progresoPorCaso` para manejar la etapa 5 desde las tarjetas. `ESTADO_ETAPA.CANCELADA` y su estilo ya existen.
- 03-27 agrega `ListaArchivos` dentro del `<details>` de cada caso en `PanelCasos`.

## Self-Check: PASSED

- Archivos creados presentes: progreso-caso.tsx/.module.css, panel-casos.tsx/.module.css, usar-diseno.ts, usar-pestanas.ts, tests/web/progreso.test.ts.
- Commits presentes en HEAD: cef8a48, b27c685, 6a27979.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
