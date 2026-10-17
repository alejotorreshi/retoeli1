---
phase: 03-chat-web-api-sse-y-despliegue
plan: 07
subsystem: ui
tags: [react, css-modules, design-tokens, accesibilidad, strictmode, sse]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "reductor conversacion y cliente SSE enviarMensaje (03-03); tokens, íconos, AvisoError y guardián W1-W13 (03-05)"
provides:
  - "web/src/hooks/usar-chat.ts: useChat, dueño de useReducer(reducirConversacion) y del envío. Solo envía desde una acción de la usuaria y el AbortController del turno vive en un ref"
  - "Encabezado (56 px, fondo secundario, título y subtítulo)"
  - "LineaDeTiempo: scroll propio, auto-scroll pegado a 96 px del fondo, botón 'Ir al final', una sola región aria-live polite ('Respuesta lista') y estado vacío"
  - "MensajeUsuaria (acento suave) y MensajeAgente (blanco con borde), con pre-wrap y overflow-wrap anywhere, como nodos de texto"
  - "IndicadorPensando: role=status, ícono girando o reloj quieto con prefers-reduced-motion"
  - "Compositor: textarea de 72 a 200 px, Enter envía y Shift+Enter hace salto de línea, ayuda tenue con aria-describedby y botón primario sobre el acento"
  - "web/index.html con favicon vacío (corta el 404 de /favicon.ico)"
affects: [03-10, 03-17, 03-19, 03-25, 03-26]

actuals:
  tokens: 6600
  tasks: 2
  commits: 2
plan_head_before: ffc096ee2a1cf311cacb99d43ac66adb08b8ece7
plan_head_after: c26977de7f8b48155bbd45205d640c080c63bf60

tech-stack:
  added: []
  patterns:
    - "Los hooks de web/src/hooks se exportan con el prefijo use (useChat), aunque el archivo esté en español, porque Biome (useHookAtTopLevel) y React reconocen los hooks por ese prefijo"
    - "Enter llama a form.requestSubmit(), así el submit es el único camino hacia el envío"
    - "El auto-scroll usa un ResizeObserver sobre el contenido, no dependencias de un efecto: cualquier crecimiento (texto, aviso, indicador) baja al final si la usuaria está a 96 px o menos"
    - "La región viva deriva su texto del estado ('Respuesta lista' al cerrar un turno sin error), sin efectos ni temporizadores"
    - "Altura del textarea con field-sizing: content entre --alto-compositor-min y --alto-compositor-max, sin JS"

key-files:
  created:
    - web/src/hooks/usar-chat.ts
    - web/src/components/encabezado.tsx
    - web/src/components/encabezado.module.css
    - web/src/components/linea-de-tiempo.tsx
    - web/src/components/linea-de-tiempo.module.css
    - web/src/components/mensaje.tsx
    - web/src/components/mensaje.module.css
    - web/src/components/indicador-pensando.tsx
    - web/src/components/indicador-pensando.module.css
    - web/src/components/compositor.tsx
    - web/src/components/compositor.module.css
  modified:
    - web/src/app.tsx
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - web/src/styles/global.css
    - web/index.html
    - docs/estructura.md

key-decisions:
  - "El hook se exporta como useChat y no como usarChat: con el nombre en español, Biome falla en useHookAtTopLevel (bun run check en rojo) y además deja de vigilar las reglas de hooks en quien lo llama. El archivo sigue siendo web/src/hooks/usar-chat.ts"
  - "Doble guarda contra un turno pagado duplicado: estado.enCurso y el ref del AbortController, que se libera cuando termina enviarMensaje. Un doble clic antes del re-render no manda dos turnos"
  - "main pasa a ser una columna flex sin scroll. El scroll lo tiene la sección de la línea de tiempo, y el encabezado y el compositor quedan fijos (UI-SPEC: 100dvh y sin scroll del body)"
  - "Las burbujas llevan un prefijo solo para lectores de pantalla ('Tú: ', 'Agente: '), así se sabe quién habla sin depender del color ni de la posición"
  - "El botón 'Enviar mensaje' deshabilitado usa --texto-tenue en lugar de una opacidad suelta, para no meter valores mágicos fuera de tokens.css"

patterns-established:
  - "Componente de lista con scroll: un marco relativo, una sección desplazable y el contenido centrado a --ancho-chat"
  - "Los componentes reciben el estado del hook por props. Solo app.tsx llama a useChat"

requirements-completed: [UI-01, UI-04]

coverage:
  - id: D1
    description: "useChat no tiene useEffect: enviarMensaje solo se llama desde enviar(), que se dispara desde el submit del Compositor"
    requirement: "UI-01"
    verification:
      - kind: other
        ref: "grep -c useEffect web/src/hooks/usar-chat.ts = 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Los componentes nuevos cumplen W1-W13 (textos en strings.ts, CSS solo con tokens, tipos en web/src/types, archivos en su carpeta de rol) y no tienen comentarios"
    requirement: "UI-04"
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts y tests/sin-comentarios.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "El reductor y el cliente SSE siguen intactos con la UI nueva"
    requirement: "UI-01"
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts y tests/web/flujo-chat.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "La pantalla renderiza sin errores: encabezado, sección con aria-label, estado vacío, región aria-live, textarea con aria-label y aria-describedby, y botón 'Enviar mensaje'"
    requirement: "UI-01"
    verification:
      - kind: other
        ref: "renderToStaticMarkup(<App />) con bun, sin clave (script temporal en el scratchpad)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A 1280×720 la pantalla sigue el layout base de la UI-SPEC: encabezado de 56 px, columna centrada de 768 px, anillo de foco en el textarea y en el botón, aviso de error en rojo con ícono, Enter envía y Shift+Enter hace salto de línea, y 'Pensando…' visible hasta turn_end"
    requirement: "UI-01"
    verification:
      - kind: automated_ui
        ref: "Pendiente: Playwright MCP del orquestador (human_verify_mode end-of-phase)"
        status: pending
    human_judgment: true
    rationale: "El layout, el foco y el color son visuales. El plan lo marca como human-check dentro del verify de la Tarea 2"

duration: 5min
completed: 2026-10-15
status: complete
---

# Phase 3 Plan 07: Chat base de la UI-SPEC Summary

**El chat pasa a la pantalla base de la UI-SPEC: encabezado de 56 px, línea de tiempo con burbujas, auto-scroll y "Ir al final", indicador "Pensando…" con role=status y un compositor donde Enter envía. El envío vive en el hook `useChat`, que solo envía desde una acción de la usuaria. Así StrictMode no puede duplicar un turno pagado.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-15T00:30:08Z
- **Completed:** 2026-10-15T00:35:00Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments

- `useChat` (en `web/src/hooks/usar-chat.ts`) es dueño de `useReducer(reducirConversacion, estadoInicialConversacion)`, del borrador y del envío. No tiene ningún efecto, y el AbortController del turno queda en un ref para el botón "Detener respuesta" del plan 03-26. Si el servidor no corrió el turno (`ERROR_HTTP` o `ERROR_RED`), el borrador vuelve al compositor.
- `LineaDeTiempo` tiene scroll propio con el contenido centrado a 768 px. Se pega al final mientras la usuaria está a 96 px o menos del fondo. Si subió, muestra el botón secundario "Ir al final" cuando llega contenido. Tiene una sola región `aria-live="polite"`, que anuncia "Respuesta lista" al cerrar un turno sin error (los errores ya se anuncian con el `role="alert"` de `AvisoError`). Sin mensajes, muestra el estado vacío con 48 px de margen.
- `MensajeUsuaria` va sobre `--acento-suave`, alineada a la derecha. `MensajeAgente` va en blanco con borde. Las dos usan `pre-wrap` y `overflow-wrap: anywhere`, y pintan el texto como nodos de React.
- `IndicadorPensando` (`role="status"`) aparece al final de la línea de tiempo desde el envío hasta `turn_end`. Con movimiento reducido, cambia el ícono girando por el reloj quieto.
- `Compositor` tiene un textarea de 72 a 200 px con scroll interno, la ayuda tenue ligada por `aria-describedby` y el botón primario sobre el acento. El textarea sigue editable durante el turno y después de un error.
- `/favicon.ico` ya no da 404, porque `web/index.html` declara `<link rel="icon" href="data:," />`.

## Task Commits

1. **Task 1: Tracer, la analista conversa en la pantalla base a través del hook** - `a863ac3` (feat)
2. **Task 2: El compositor sigue la UI-SPEC** - `c26977d` (feat)

## Files Created/Modified

- `web/src/hooks/usar-chat.ts`: `useChat`.
- `web/src/components/encabezado.tsx` y `.module.css`: `Encabezado`.
- `web/src/components/linea-de-tiempo.tsx` y `.module.css`: `LineaDeTiempo`, con el turno, el estado vacío, el auto-scroll y la región viva.
- `web/src/components/mensaje.tsx` y `.module.css`: `MensajeUsuaria` y `MensajeAgente`.
- `web/src/components/indicador-pensando.tsx` y `.module.css`: `IndicadorPensando`.
- `web/src/components/compositor.tsx` y `.module.css`: `Compositor`.
- `web/src/app.tsx`: compone `Encabezado`, `LineaDeTiempo` con el indicador y `Compositor`.
- `web/src/config/strings.ts`: `separador`, `respuestaLista`, `irAlFinal` y los prefijos de autor. La ayuda se arma con el mismo separador.
- `web/src/config/constants/ui.constants.ts`: `DISTANCIA_PEGADO_AL_FINAL` (96). Se retiraron `FILAS_COMPOSITOR` y `ESTILO_TEXTO_PLANO`, que ya no se usan.
- `web/src/types/chat.type.ts` (`ControlChat`) y `web/src/types/ui.type.ts` (`PropsLineaDeTiempo`, `PropsTurno`, `PropsMensaje`, `PropsCompositor`).
- `web/src/styles/global.css`: `main` como columna flex sin scroll propio.
- `web/index.html`: favicon vacío.
- `docs/estructura.md`: el rol de `web/src/hooks/` con la regla del prefijo `use` y los componentes nuevos.

## Decisions Made

Ver `key-decisions` en el frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] El hook se exporta como `useChat` en lugar de `usarChat`**
- **Found during:** Task 1
- **Issue:** Biome (`lint/correctness/useHookAtTopLevel`) reconoce los hooks solo por el prefijo `use`. Con `usarChat`, las llamadas a `useReducer`, `useState` y `useRef` quedan dentro de una función que no parece hook, y `bun run check` falla. Desactivar la regla también apagaría la vigilancia de las reglas de hooks en quien lo llama.
- **Fix:** el export es `useChat` y el archivo sigue siendo `web/src/hooks/usar-chat.ts`. La regla quedó documentada en `docs/estructura.md`.
- **Files modified:** web/src/hooks/usar-chat.ts, web/src/app.tsx, docs/estructura.md
- **Commit:** a863ac3

**2. [Rule 3 - Blocking] `global.css`: `main` deja de hacer scroll**
- **Found during:** Task 1
- **Issue:** en 03-05, `#root > main` tenía `overflow-y: auto`. La UI-SPEC pide que la línea de tiempo tenga scroll propio y que el compositor quede fijo, y W13 no admite un `app.module.css` suelto.
- **Fix:** `main` pasa a ser una columna flex con `min-height: 0`, y el scroll vive en la sección de `LineaDeTiempo`.
- **Files modified:** web/src/styles/global.css
- **Commit:** a863ac3

**3. [Rule 2 - Missing Critical] Guarda del turno en curso con el ref del AbortController**
- **Found during:** Task 1 (amenaza T-03-07)
- **Issue:** `estado.enCurso` se lee del cierre del render. Dos envíos antes del re-render podían pasar los dos.
- **Fix:** `enviar()` también rechaza el envío mientras haya un controlador activo, y lo libera en el `finally` de `enviarMensaje`.
- **Commit:** a863ac3

**4. [Rule 2 - Missing Critical] Favicon vacío en `web/index.html`**
- **Found during:** Task 2 (seguimiento de 03-03 y 03-05)
- **Issue:** el navegador pedía `/favicon.ico` y recibía 404, que era el único error de consola. Ningún plan posterior lo cubre.
- **Fix:** `<link rel="icon" href="data:," />`.
- **Commit:** c26977d

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 missing critical)
**Impact on plan:** sin cambios de alcance ni dependencias nuevas. Lo único que difiere del plan es el nombre exportado del hook.

## Issues Encountered

- Biome 2.5.15 acepta `field-sizing: content`. En navegadores sin soporte (Firefox), el textarea queda en 72 px con scroll interno, que sigue siendo usable.

## Verificación

- `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts tests/web`: 57 pass, 0 fail.
- `bun run build:web` y `bun run check` (tsc raíz, tsc web, Biome y bun audit): en verde.
- `bun test` completo con `--env-file=/dev/null`: 1678 pass, 1 skip (prueba en vivo existente), 0 fail.
- Criterios de aceptación: `useEffect` en `usar-chat.ts` = 0. Colores hex en los cinco módulos CSS nuevos = 0. `role="status"` en el indicador y `aria-label` en el compositor están presentes.
- Gate del tracer (interactivo, `end-of-phase`, verify solo automático): se volvió a correr el verify completo y pasó.

## Verificación visual pendiente (orquestador, Playwright MCP)

Sin una clave real, el orquestador puede ver lo siguiente con `bun run dev` (API en 3000, web en 5173) y la env falsa:
- Estado vacío: encabezado de 56 px, título "¿Qué caso procesamos?" centrado en la columna de 768 px y compositor fijo abajo con la ayuda y el botón sobre el acento.
- Foco: Tab hasta el textarea y el botón muestra el anillo de 2 px de acento.
- Al enviar con Enter: la burbuja de la usuaria sobre el acento suave, "Pensando…" mientras dura el pedido y, con un 401 (sin acceso hasta 03-10) o con un error del proveedor, el `AvisoError` rojo con ícono bajo el turno y el borrador devuelto al textarea.
- Shift+Enter inserta un salto de línea sin enviar.

## Next Phase Readiness

- 03-10 (fecha en el encabezado), 03-17 (estado del modelo), 03-19 (herramienta en curso y la línea de "servidor despertando") y 03-26 ("Nueva sesión" y "Detener respuesta", que usa el ref del turno) se enchufan en `Encabezado`, `IndicadorPensando`, `Compositor` y `useChat`.

## Self-Check: PASSED
