---
phase: 03-chat-web-api-sse-y-despliegue
plan: 27
subsystem: ui
tags: [react, dialog, descarga, vista-previa, disco-efimero, ui-06, api-05]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-24: GET de lista, descarga y vista previa por lista blanca (caso conocido sin carpeta = []); 03-22: PanelCasos y progresoPorCaso; 03-26: patrón de <dialog> modal y control de la sesión"
provides:
  - "listarArchivos, descargarArchivo, obtenerVistaPrevia y las rutas rutaDeArchivos, rutaDeDescarga y rutaDeVistaPrevia en web/src/api/cliente-api.ts"
  - "descarga-local.ts: guardarEnElEquipo (URL de objeto temporal con download, liberada después)"
  - "useArchivos: lista por caso al expandir y tras cada turno terminado que tocó el caso; recuerda un 404"
  - "archivosFaltantes, discoBorrado, marcasDeArchivos y esArchivoNoEncontrado en web/src/state/casos.ts"
  - "ListaArchivos, DialogoVistaPrevia y AvisoDiscoEfimero en el bloque de cada caso"
  - "useChat.vencerAcceso: un 401 al listar, ver o descargar vuelve a la pantalla de acceso"
affects: [verificación de fin de fase con Playwright, guion §11 en el link público]

actuals:
  tokens: 17100
  tasks: 2
  commits: 3
plan_head_before: a35932cb1ad5ea576d7f1b0380caf10c5b1f5783
plan_head_after: f35bb081e34ec64779299625b7fa0c49a1c7ae62

tech-stack:
  added: []
  patterns:
    - "Descargar es un <a href download> real con la ruta de la lista blanca, interceptado para pedir el archivo con fetch y ver un 404 antes de guardarlo"
    - "El disco borrado se decide en una función pura (discoBorrado) con el progreso, la lista y la marca de 404; la UI solo pinta"
    - "Lo único del front que toca el document para descargar vive en web/src/api/descarga-local.ts, fuera del alcance del tsc de la raíz"

key-files:
  created:
    - web/src/api/descarga-local.ts
    - web/src/hooks/usar-archivos.ts
    - web/src/components/lista-archivos.tsx
    - web/src/components/lista-archivos.module.css
    - web/src/components/dialogo-vista-previa.tsx
    - web/src/components/dialogo-vista-previa.module.css
    - web/src/components/aviso-disco-efimero.tsx
    - web/src/components/aviso-disco-efimero.module.css
    - tests/web/archivos.test.ts
  modified:
    - web/src/api/cliente-api.ts
    - web/src/state/casos.ts
    - web/src/components/panel-casos.tsx
    - web/src/hooks/usar-chat.ts
    - web/src/app.tsx
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - docs/estructura.md

key-decisions:
  - "03-27: archivosFaltantes devuelve las etapas hechas cuyo archivo esperado no está en disco (Generado: formulario o valores-portal.md; Paquete: checklist; Envío: ENVIO-SIMULADO.md), con la tabla ARCHIVOS_ESPERADOS_POR_ETAPA en ui.constants.ts; mientras la lista carga o falla no se acusa un reinicio"
  - "03-27: un 404 al ver o descargar marca el caso como borrado hasta que un turno nuevo toca el caso (la marca de archivos cambia y la lista se vuelve a pedir)"
  - "03-27: la lista se refresca sin volver a 'Cargando archivos…' si ya había una; esa copia solo aparece en la primera carga y en Reintentar"
  - "03-27: el foco inicial del diálogo de vista previa va a 'Cerrar vista previa' y vuelve al 'Ver' que lo abrió; los contenedores con scroll no llevan tabIndex (Biome noNoninteractiveTabindex)"

patterns-established:
  - "Rutas de artefactos en el front: se reemplazan los segmentos :caso y :nombre de los patrones RUTA_API, codificados, y paquete/ va por su propia ruta"

requirements-completed: [UI-06, API-05]

coverage:
  - id: D1
    description: "Los archivos de cada caso aparecen en su bloque con nombre, tipo, Ver (salvo soportes) y Descargar con aria-label; cargando, vacío y error con Reintentar"
    requirement: UI-06
    verification:
      - kind: unit
        ref: "tests/web/archivos.test.ts#listarArchivos"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts#textos de archivos, vista previa y disco efímero (UI-SPEC)"
        status: pass
      - kind: other
        ref: "bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts tests/web && bun run build:web && bun run check"
        status: pass
    human_judgment: true
    rationale: "La lista pintada en el panel, su layout a 1280 y 375 px y el refresco tras cada turno solo se ven en el navegador; los verifica el orquestador con Playwright y el LLM falso"
  - id: D2
    description: "Descargar entrega el archivo real con su nombre y un 404 no guarda nada y queda como archivo borrado"
    requirement: API-05
    verification:
      - kind: unit
        ref: "tests/web/archivos.test.ts#descargarArchivo"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts#rutas de archivos del cliente"
        status: pass
    human_judgment: true
    rationale: "Que el navegador guarde el PDF real con la URL de objeto bajo la CSP solo se comprueba con una descarga real en Playwright"
  - id: D3
    description: "Disco borrado: Generado, Paquete o Envío hechos sin su archivo, o un 404 al ver o descargar, muestran el aviso D-67; con todo presente no"
    requirement: UI-06
    verification:
      - kind: unit
        ref: "tests/web/archivos.test.ts#archivosFaltantes: lo que el progreso espera en disco (D-67)"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts#discoBorrado: cuándo el caso muestra el aviso de reinicio (D-67)"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts#esArchivoNoEncontrado"
        status: pass
    human_judgment: false
  - id: D4
    description: "La vista previa valida la tabla enmascarada o el texto del servidor y rechaza estados desconocidos; un 404 cuenta como archivo borrado"
    requirement: UI-06
    verification:
      - kind: unit
        ref: "tests/web/archivos.test.ts#obtenerVistaPrevia"
        status: pass
    human_judgment: false
  - id: D5
    description: "DialogoVistaPrevia modal (Esc, foco de vuelta a Ver), tabla con encabezado fijo, badges, '—' para nulos y nota; .md en monoespaciada pre-wrap; chip 'Procesar {caso} de nuevo'"
    requirement: UI-06
    verification: []
    human_judgment: true
    rationale: "Foco del <dialog> nativo, encabezado fijo con scroll, el aviso tras borrar out/<caso> con el servidor andando y el guion §11 en el link público solo se comprueban en el navegador"

duration: 10min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 27: Archivos del caso en el panel (lista, descarga, vista previa y disco efímero) Summary

**Cada bloque de caso del panel lista lo que existe en disco con "Ver" y "Descargar". La descarga pide el archivo real por la ruta de la lista blanca y lo guarda con una URL de objeto temporal. "Ver" abre un `<dialog>` modal con la tabla enmascarada (encabezado fijo, badges Lleno/Faltante/Por confirmar y "—" para nulos) o el texto plano del `.md`. Si el progreso espera un archivo que no está, o si ver o descargar responde 404, el caso muestra "El servidor se reinició y los archivos se borraron; vuelve a procesar el caso." con el chip "Procesar {caso} de nuevo", que manda "procesa el caso {caso}" por el envío normal. Nada se regenera solo.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-15T05:36:41Z
- **Completed:** 2026-10-15T05:46:00Z
- **Tasks:** 2
- **Files modified:** 19 (9 creados)

## Accomplishments

- `cliente-api.ts` gana `listarArchivos` (valida `{ archivos }` contra `TIPO_ARCHIVO_CASO`), `descargarArchivo` (recibe la función de guardado, así es probable sin navegador), `obtenerVistaPrevia` (valida la tabla con `ESTADO_CAMPO` o el texto) y las rutas `rutaDeArchivos`, `rutaDeDescarga` y `rutaDeVistaPrevia`. Las rutas reemplazan los segmentos `:caso` y `:nombre` de `RUTA_API`, codificados, y `paquete/…` va por `ARCHIVO_PAQUETE` o `VISTA_PREVIA_PAQUETE`.
- `useArchivos` pide la lista cuando el bloque se expande y cada vez que cambia la marca del caso, que es el número de turnos terminados con herramientas de ese caso (`marcasDeArchivos`). Recuerda un 404 hasta el siguiente turno que toque el caso. Las descargas y la marca de borrado son callbacks estables.
- `ListaArchivos` tiene filas de al menos 40 px: el nombre en monoespaciada, el tipo en texto tenue ("Formulario", "Valores para portal", "Checklist", "Borrador de correo", "Envío simulado", "Soporte"), "Ver" (solo si `previsualizable`) y "Descargar" (un `<a href download>` real que se intercepta), ambos en acento y con `aria-label` "Ver {nombre}" o "Descargar {nombre}". También muestra "Cargando archivos…", el estado vacío y "No pudimos traer los archivos de este caso." con "Reintentar".
- `DialogoVistaPrevia` usa `showModal()`, `aria-labelledby` con el nombre del archivo, Esc cierra y el foco vuelve al "Ver" que lo abrió. Tiene un ancho de hasta 960 px y un alto de 80 vh. La tabla tiene las columnas "Etiqueta", "Valor (enmascarado)", "Estado" y "Nota", con `th` sticky y el scroll propio a 60 vh. El `.md` va en `<pre>` monoespaciado con `pre-wrap` y 60 vh. Muestra "Cargando la vista previa…", el error de la UI-SPEC y los botones "Descargar archivo" y "Cerrar vista previa". Todo se pinta como texto de React.
- `AvisoDiscoEfimero` usa la paleta de atención y el ícono de alerta. Su chip se deshabilita durante un turno.
- `useChat.vencerAcceso` hace que un 401 al listar, ver o descargar lleve a la pantalla de acceso, como en el resto de la app.

## Task Commits

1. **Task 1 (tracer): lista de archivos y Descargar del archivo real**: `a80310f` (feat)
2. **Task 2 (TDD): Ver con vista previa enmascarada y aviso de disco borrado**: RED `760a6a6` (test), GREEN `f35bb08` (feat)

**Gate del tracer:** el `<verify>` automático pasó completo (233 pruebas de `tests/arquitectura-web.test.ts`, `tests/sin-comentarios.test.ts` y `tests/web`, más `build:web` y `bun run check`). El modo es interactivo y `end-of-phase`, y el tracer trae un `<human-check>`, así que la fila 4 del gate pedía detenerse. Seguí con la Tarea 2 porque el orquestador indicó que él hace la verificación visual después con Playwright y el LLM falso, igual que en 03-22, 03-23, 03-25 y 03-26.

## TDD Gate Compliance (Tarea 2)

- **RED (`760a6a6`):** `tests/web/archivos.test.ts` tiene 27 pruebas. Para que el archivo cargara se agregaron andamios vacíos: `archivosFaltantes` devolvía `[]`, `discoBorrado` devolvía `false`, `obtenerVistaPrevia` devolvía `SIN_RED`, y `TEXTO_DISCO` y `TEXTO_VISTA_PREVIA` tenían textos vacíos. Comando: `bun --env-file=/dev/null test tests/web/archivos.test.ts --reporter=junit`, con exit 1: 27 pruebas, 16 pasan y 11 fallan. `gsd-tools check tdd-red-evidence` dio **RED_EVIDENCE_OK** (`target_test_failed`, junit, sin `report_errors`). La prueba objetivo es "Generado hecho sin formulario ni valores-portal.md marca el caso como borrado".
- **Evaluación semántica:** la prueba objetivo corrió y falló en la aserción planeada. `toEqual(["generado"])` recibió `[]`, porque el andamio todavía no comparaba el progreso con la lista. Las otras 10 fallas también son aserciones del comportamiento: el Paquete y el Envío sin su archivo, el 404 en `discoBorrado`, la vista previa sin validar y las copias vacías. No hubo errores de carga, de sintaxis ni de fixtures. Las pruebas que pasaron desde el principio cubren cosas que ya existían de la Tarea 1 (lista, descarga, rutas y marcas) o casos de `[]` y `false` que el andamio cumple por defecto (todo presente, sin etapas hechas, cargando).
- **GREEN (`f35bb08`):** se agregaron `ARCHIVOS_ESPERADOS_POR_ETAPA`, `archivosFaltantes`, `discoBorrado`, la validación de `obtenerVistaPrevia`, las copias reales, `DialogoVistaPrevia`, `AvisoDiscoEfimero` y el cableado en `PanelCasos`. Resultado: 27 de 27, y la suite completa da 2109 pass, 1 skip y 0 fail.
- **REFACTOR:** no hizo falta.

## Files Created/Modified

- `web/src/api/cliente-api.ts`: lista, descarga, vista previa y rutas.
- `web/src/api/descarga-local.ts`: `guardarEnElEquipo`, lo único que toca el `document` para descargar.
- `web/src/hooks/usar-archivos.ts`: `useArchivos`.
- `web/src/state/casos.ts`: `archivosFaltantes`, `discoBorrado`, `marcasDeArchivos` y `esArchivoNoEncontrado`.
- `web/src/components/lista-archivos.tsx` y `.module.css`, `dialogo-vista-previa.tsx` y `.module.css`, y `aviso-disco-efimero.tsx` y `.module.css`.
- `web/src/components/panel-casos.tsx`: cada bloque muestra el aviso, la lista y su diálogo.
- `web/src/hooks/usar-chat.ts` y `web/src/app.tsx`: `vencerAcceso` y las props nuevas del panel.
- `web/src/config/strings.ts`: `TEXTO_ARCHIVOS`, `TEXTO_DISCO` y `TEXTO_VISTA_PREVIA`.
- `web/src/config/constants/ui.constants.ts`: `ESTADO_LISTA_ARCHIVOS`, `ESTADO_VISTA_PREVIA`, `ESPERA_LIBERAR_DESCARGA_MS` y `ARCHIVOS_ESPERADOS_POR_ETAPA`.
- `web/src/types/chat.type.ts` y `web/src/types/ui.type.ts`: los tipos de archivos, vista previa y props.
- `docs/estructura.md`: nombra los módulos nuevos.
- `tests/web/archivos.test.ts`: 27 pruebas.

## Decisions Made

Ver `key-decisions` en el frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Bloqueante] El guardado en el equipo se separó en `web/src/api/descarga-local.ts`**
- **Found during:** Tarea 1
- **Issue:** el `tsc` de la raíz revisa `cliente-api.ts` (lo importan las pruebas) sin la lib `dom`, así que `document` no compilaba.
- **Fix:** `descargarArchivo` recibe la función de guardado. `guardarEnElEquipo` vive en su propio módulo y la pasa `useArchivos`. De paso, la descarga se puede probar con un guardado falso.
- **Committed in:** `a80310f`

**2. [Rule 2 - Correctitud] Un 401 al listar, ver o descargar lleva a la pantalla de acceso**
- **Found during:** Tarea 1
- **Issue:** la UI-SPEC pide que cualquier 401 lleve a `PantallaAcceso`. Sin esto, la lista quedaba en error y "Reintentar" repetía el 401.
- **Fix:** `useChat.vencerAcceso` (estable) despacha `ACCESO_PEDIDO` con el mensaje del servidor, y el panel lo pasa al hook y al diálogo.
- **Files modified:** `web/src/hooks/usar-chat.ts`, `web/src/types/chat.type.ts`, `web/src/app.tsx` (fuera de `files_modified`)
- **Committed in:** `a80310f`

**3. [Nota] Archivos fuera de `files_modified`**
- Se tocaron `web/src/types/ui.type.ts` (W10 exige ahí las props), `web/src/config/constants/ui.constants.ts`, `web/src/app.tsx`, `web/src/hooks/usar-chat.ts` y `docs/estructura.md`, además de `descarga-local.ts`.

**4. [Nota] key_link "aviso-disco-efimero → usar-chat, patrón 'procesa el caso'"**
- El texto "procesa el caso {caso}" vive en `TEXTO_DISCO.mensaje` de `web/src/config/strings.ts`, porque W8 prohíbe texto legible fuera de ahí. El chip lo manda con `alProcesar`, que es `enviarTexto` de `useChat` y pasa por `App` y `PanelCasos`. El literal no aparece en `aviso-disco-efimero.tsx`.

---

**Total deviations:** 2 auto-fixed (1 Rule 3, 1 Rule 2) y 2 notas.
**Impact on plan:** ninguno sobre el alcance.

## Issues Encountered

- Biome rechazó `tabIndex={0}` en los contenedores con scroll del diálogo (`noNoninteractiveTabindex`). Se quitó. Chrome ya enfoca por teclado los contenedores con scroll.

## Verification

- `bun --env-file=/dev/null test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts tests/web`: 233 pass tras la Tarea 1.
- `bun --env-file=/dev/null test`: 2109 pass, 1 skip, 0 fail (incluye el escaneo de PII de la fase 1 y las pruebas de artefactos de 03-24).
- `bun run build:web` y `bun run check` (tsc, tsc web, Biome y `bun audit`): pasan.
- Criterios de aceptación: `lista-archivos.tsx` tiene `aria-label` para Ver y Descargar; `grep -rl "mapeo.json" web/src` no imprime nada; `dialogo-vista-previa.tsx` llama `showModal`; `tests/web/archivos.test.ts` cubre las tres condiciones de borrado y el caso con todo presente.

## Verificación pendiente (orquestador)

- Con Playwright y el LLM falso (`fake-llm-03-23.ts`, puerto 4023), después del chip §11:
  1. El bloque de ec-corp-andina lista `formulario.pdf`, `paquete/checklist.md`, `paquete/borrador-correo.md` y los soportes copiados, y "Descargar" guarda el PDF real.
  2. "Ver" en `formulario.pdf` muestra la tabla enmascarada (el RUC como `•••••3456` y el faltante como "—"). Esc cierra y el foco vuelve a "Ver".
  3. "Ver" en `valores-portal.md` de pa-logistica-istmo no muestra la cuenta ni el SWIFT completos, y "Ver" en `borrador-correo.md` muestra el nombre y el cargo del firmante completos (D-74).
  4. Al borrar `out/ec-corp-andina` con el servidor andando y volver a expandir el caso (o tras un turno), aparecen el aviso de reinicio y "Procesar ec-corp-andina de nuevo".
  5. A 1280×720 y 375×667, la línea de tiempo, el panel y el diálogo hacen scroll propio y el encabezado de la tabla queda fijo.
- Fin de fase en el link público: hace falta que la usuaria haga push de main para que Render redespliegue. Después, con el código de acceso, se corre el guion §11 con el chip y Confirmar, se recarga a mitad de camino, se descarga un archivo, se abre una vista previa y se revisa que health muestre el estado del modelo.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Es el último plan de la fase 3. El panel cierra UI-06 y la mitad de API-05 que corre en el navegador. Para cerrar la fase faltan la verificación en el navegador del orquestador y la prueba en el link público después del push de la usuaria.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED

Los 9 archivos creados existen y los commits `a80310f`, `760a6a6` y `f35bb08` están en HEAD.
