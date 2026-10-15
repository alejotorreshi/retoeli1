---
phase: 03-chat-web-api-sse-y-despliegue
plan: 21
subsystem: ui
tags: [react, resultado, acciones-rapidas, knowledge, ui-05, ui-07, core-value]
status: complete

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-16 ResultadoVisible en cada tool_end (null si la herramienta falló); 03-19 tarjetas por llamadaId en el reducer; 03-08/03-10 ConfigResponse.casos"
provides:
  - "resultadosPorCaso y resultadosDelTurno (web/src/state/casos.ts): pliegue puro del resultado de cada tool_end por caso; nunca lee eventos de texto"
  - "TarjetaResultado: caso, badges de formato y país, contadores Llenos/Faltantes/Por confirmar (0 en tenue), badge Listo para firma / No listo para firma / Paquete sin armar, Bloqueos legibles o Sin bloqueos, out/{caso}/ y el aviso de portal; — para todo lo que el turno no produjo"
  - "AccionesRapidas: tres chips (Demo §11, Procesar los N casos desde /api/config, ¿Qué casos hay?) en el estado vacío y en una franja compacta sobre el compositor; deshabilitados durante un turno"
  - "useChat.enviarTexto(mensaje) para mandar un texto sin tocar el borrador"
  - "Una oración del conocimiento: listar los casos con proveedor_leer_solicitud y el caso vacío (sin sexta herramienta), fijada por tests/contract/instrucciones-agente.test.ts y tests/loop/listar-casos.test.ts"
affects: [03-22 ProgresoCaso y PanelCasos (pueden reusar el pliegue por caso), verificación visual de la fase 3, UAT de los resúmenes de las tarjetas de herramienta]

actuals:
  tokens: 11950
  tasks: 2
  commits: 3
plan_head_before: e6c2b2f5955aed6490f26783bef1fb3e1570c0d3
plan_head_after: 5a8960b3f456ef531fc0beedfcd55b1d99a73af1

tech-stack:
  added: []
  patterns:
    - "La tarjeta de resultado se pliega solo desde LlamadaDelTurno.resultado (el ResultadoVisible del servidor): el último campo no nulo gana por caso, y un tool_end fallido (resultado null) no cambia nada"
    - "Cada turno muestra la tarjeta de los casos que tocó, con el estado acumulado hasta ese turno (resultadosDelTurno)"
    - "La ruta de salida solo se muestra cuando armar_paquete devolvió una ruta dentro de out/{caso}/; antes queda —"
    - "Los chips son un fieldset (rol group implícito) y el texto de cada chip deriva de una constante (CASO_DEMO_PRD) o de la lista de casos del servidor"

key-files:
  created:
    - web/src/state/casos.ts
    - web/src/components/tarjeta-resultado.tsx
    - web/src/components/tarjeta-resultado.module.css
    - web/src/components/acciones-rapidas.tsx
    - web/src/components/acciones-rapidas.module.css
    - tests/loop/listar-casos.test.ts
    - tests/web/acciones-rapidas.test.ts
  modified:
    - web/src/state/conversacion.ts
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/components/linea-de-tiempo.tsx
    - web/src/components/linea-de-tiempo.module.css
    - web/src/hooks/usar-chat.ts
    - web/src/app.tsx
    - src/knowledge/registro-proveedor.md
    - tests/web/herramientas.test.ts
    - tests/contract/instrucciones-agente.test.ts

key-decisions:
  - "La tarjeta de resultado se arma solo con el resultado estructurado de las herramientas (T-03-25): casos.ts no referencia TIPO_EVENTO.TEXTO"
  - "Sin paquete armado, la tarjeta dice Paquete sin armar y muestra — en bloqueos y ruta aunque generar_formulario haya devuelto una ruta (fila partial de la UI-SPEC)"
  - "Los conteos salen del resultado de mapear_campos, porque generar_formulario devuelve conteo null (03-16)"
  - "El listado de casos usa proveedor_leer_solicitud con caso vacío (CASO_NO_ENCONTRADO + casos_disponibles); no se agrega una sexta herramienta y prompt.md no cambia"
  - "La etiqueta del chip de casos se deriva de la cantidad recibida (Procesar los {n} casos) y el chip queda deshabilitado mientras no llegó la config"

patterns-established:
  - "Un componente que se muestra en dos lugares (estado vacío y franja sobre el compositor) recibe una prop compactas y la app decide dónde va según haya historial"

requirements-completed: [UI-05, UI-07]

coverage:
  - id: D1
    description: "Tarjeta de resultado por caso armada solo con los datos de las herramientas, con Paquete sin armar y guiones para lo que el turno no produjo"
    requirement: "UI-05"
    verification:
      - kind: unit
        ref: "tests/web/herramientas.test.ts#resultado por caso armado solo con los datos de las herramientas (UI-05)"
        status: pass
      - kind: manual_procedural
        ref: "Playwright del orquestador: prompt §11 → tarjeta de ec-corp-andina con 13/1/1, No listo para firma y el certificado faltante legible"
        status: unknown
  - id: D2
    description: "Tres chips de acciones rápidas que mandan el prompt §11, los casos de /api/config y la pregunta por los casos; deshabilitados durante un turno"
    requirement: "UI-07"
    verification:
      - kind: unit
        ref: "tests/web/acciones-rapidas.test.ts"
        status: pass
      - kind: manual_procedural
        ref: "Playwright del orquestador: a 375 px los chips caben en dos filas sin scroll horizontal"
        status: unknown
  - id: D3
    description: "El agente lista los casos con las cinco herramientas (leer_solicitud con caso vacío)"
    requirement: "UI-07"
    verification:
      - kind: integration
        ref: "tests/loop/listar-casos.test.ts"
        status: pass
      - kind: unit
        ref: "tests/contract/instrucciones-agente.test.ts#el conocimiento lista los casos con leer_solicitud y el caso vacío"
        status: pass

duration: 25min
completed: 2026-10-14
---

# Fase 3 Plan 21: Tarjeta de resultado por caso y acciones rápidas Resumen

**Cada caso que toca un turno muestra una TarjetaResultado plegada solo desde el ResultadoVisible de sus tool_end (contadores, firma, bloqueos legibles, out/{caso}/ y aviso de portal), y tres chips arrancan la demo §11, los casos que informa el servidor o el listado, que el agente resuelve con proveedor_leer_solicitud y el caso vacío.**

## Rendimiento

- **Duración:** unos 25 min, contando la reanudación (el ejecutor anterior murió por un ENOTFOUND antes de su primer commit)
- **Completado:** 2026-10-14
- **Tareas:** 2
- **Archivos:** 19 (7 creados y 12 modificados)

## Logros

- `resultadosPorCaso` / `resultadosDelTurno` pliegan por caso los campos del `resultado` de cada `tool_end`; el último valor no nulo gana. Un `tool_end` fallido no cambia nada, y un caso que solo tuvo llamadas fallidas no tiene tarjeta.
- `TarjetaResultado` (`<article>` dentro de la lista del turno) va después del texto del agente, en el orden de la UI-SPEC. Muestra el título del caso en 20/600, los badges de formato (XLSX, PDF o Portal) y de país, y tres contadores en tabular-nums (0 o — en tenue). El badge de firma usa éxito, error o información. Siguen los "Bloqueos" legibles o "Sin bloqueos", la ruta `out/{caso}/` en monoespaciada y el aviso fijo del portal.
- `AccionesRapidas` es un `fieldset` con aria-label "Acciones rápidas". En una sesión sin mensajes aparece dentro del estado vacío (con 48 px de margen superior). Con historial pasa a una franja compacta sobre el compositor. Los chips usan `flex-wrap` con 8 px de separación y se deshabilitan durante el turno; el de casos también, mientras no llegó la config.
- El mensaje de la demo es el prompt literal del PRD §11 en un párrafo, comparado en el test contra `reto-01/PRD.md`. El de los casos usa la plantilla con la lista de `ConfigResponse.casos`, y el componente no escribe ningún id de caso.
- El conocimiento suma una oración: "Si la analista pregunta qué casos hay, llama a proveedor_leer_solicitud con el caso vacío ("") y muéstrale la lista casos_disponibles de la respuesta."

## Commits de las tareas

1. **Tarea 1: tarjeta de resultado por caso (UI-05, trazador):** `ea06282` (feat)
2. **Tarea 2: acciones rápidas y listado de casos (UI-07, TDD):**
   - RED: `dfd9297` (test)
   - GREEN: `5a8960b` (feat)

## Archivos creados y modificados

- `web/src/state/casos.ts`: pliegue puro por caso, `estadoDeFirma` y `contadoresDe`
- `web/src/components/tarjeta-resultado.tsx` y `.module.css`: la tarjeta de resultado
- `web/src/components/acciones-rapidas.tsx` y `.module.css`: los tres chips
- `web/src/state/conversacion.ts` y `web/src/types/chat.type.ts`: `LlamadaDelTurno.resultado`, `ResultadoDeCaso`, `ContadorDeCaso`, `EstadoFirma` y `ControlChat.enviarTexto`
- `web/src/types/ui.type.ts`: props de la tarjeta, de los chips y del estado vacío
- `web/src/config/strings.ts` y `web/src/config/constants/ui.constants.ts`: `TEXTO_RESULTADO`, `TEXTO_ACCIONES`, `ESTADO_FIRMA`, `SEPARADOR_RUTA`, `CASO_DEMO_PRD` y `SEPARADOR_LISTA_CASOS`
- `web/src/components/linea-de-tiempo.tsx` y `.module.css`: tarjetas por turno, y chips en el estado vacío
- `web/src/hooks/usar-chat.ts` y `web/src/app.tsx`: `enviarTexto`, y los chips cableados a la config y al envío
- `src/knowledge/registro-proveedor.md`: la oración del listado
- `tests/web/herramientas.test.ts`, `tests/web/acciones-rapidas.test.ts`, `tests/loop/listar-casos.test.ts` y `tests/contract/instrucciones-agente.test.ts`

## Decisiones

Están en el frontmatter, en `key-decisions`.

## Desviaciones del plan

### Recuperación

**1. [Reanudación] El RED de la Tarea 1 no tiene commit propio.** La Tarea 1 es de tipo `tracer`, no `tdd`, así que no exigía un commit RED. El ejecutor anterior dejó sin commit, en el árbol principal, la implementación casi completa (casos.ts, tarjeta, estilos, textos, tipos y tests). Esta ejecución la revisó, verificó que los tests, `build:web` y `bun run check` pasaban y la commiteó como un único `feat` (`ea06282`). No se fabricó un commit RED a posteriori.

### Ajustes automáticos

**1. [Regla 2 - Corrección] `useChat.enviarTexto` en vez de reusar `enviar()`.**
- **Encontrado en:** Tarea 2
- **Problema:** `enviar()` solo mandaba el borrador. Los chips necesitaban mandar un texto propio sin pisar lo que la analista estaba escribiendo.
- **Solución:** `enviarTexto(mensaje)` concentra la lógica del envío y `enviar()` lo llama con el borrador. El reducer ya limpiaba el borrador solo si coincidía con el mensaje enviado.
- **Archivos:** web/src/hooks/usar-chat.ts, web/src/types/chat.type.ts
- **Commit:** 5a8960b

**2. [Regla 3 - Bloqueo] `fieldset` en lugar de `div role="group"`.**
- **Encontrado en:** Tarea 2
- **Problema:** Biome (`lint/a11y/useSemanticElements`) rechaza `role="group"` sobre un `div`, y `bun run check` fallaba.
- **Solución:** un `<fieldset aria-label="Acciones rápidas">` (rol group implícito) con margen, padding y borde en cero.
- **Archivos:** web/src/components/acciones-rapidas.tsx, .module.css
- **Commit:** 5a8960b

**3. [Regla 2 - Texto derivado] Etiqueta "Procesar los {n} casos" a partir de la lista del servidor.** El número no queda escrito a mano, por la regla del proyecto de que un texto que repite un dato se deriva de él. Con 0 casos (la config todavía no llegó) dice "Procesar los casos" y el chip queda deshabilitado. El id de la demo vive en `CASO_DEMO_PRD`.

**4. [Cobertura extra] `tests/web/acciones-rapidas.test.ts`.** Este archivo no estaba en el plan. Fija el prompt §11 contra `reto-01/PRD.md` (solo lectura), la plantilla de los cuatro casos y que el componente no tenga ids de caso.

## Fuera de alcance, seguimiento para UAT

La revisión con Playwright de 03-19 encontró dos problemas en los resúmenes de las tarjetas de herramienta. Esos textos son de la fase 2, en `src/config/strings.ts` (cerca de la línea 182, `${n} faltantes`), y el resumen de armar_paquete:
1. La concordancia de número falla: dice "1 faltantes" y "1 llenos".
2. El resumen de armar_paquete muestra los ids crudos de los soportes ("vencido: camara_comercio …; ausente: certificado_cumplimiento_tributario").

Este plan no los toca. `src/config/strings.ts` no está en sus archivos, y ese `resumen` viaja también en la respuesta que la herramienta le devuelve al modelo, que esta fase no debe cambiar. La **TarjetaResultado** ya usa `bloqueosLegibles` (nombres legibles) y rótulos fijos de contador ("Llenos", "Faltantes", "Por confirmar") sin concordancia numérica, así que la tarjeta nueva no tiene ninguno de los dos problemas. Quedan para UAT o para un plan de corrección.

## Verificación

- `bun test`: 1913 pass y 0 fail.
- `bun test tests/web/herramientas.test.ts tests/arquitectura-web.test.ts`: pass. Es la verificación de la Tarea 1, que como trazador se volvió a correr antes de expandir.
- `bun test tests/loop/listar-casos.test.ts tests/contract/instrucciones-agente.test.ts tests/arquitectura-web.test.ts`: pass. En RED fallaron exactamente los 2 tests nuevos, porque faltaba la oración del conocimiento.
- `bun run build:web` y `bun run check` (tsc, tsc web, biome y bun audit): exit 0.
- `grep -c "TIPO_EVENTO.TEXTO" web/src/state/casos.ts` da 0, y `grep -c 'caso: ""\|caso vacío\|caso empty' src/knowledge/registro-proveedor.md` da 1.
- Quedan pendientes las comprobaciones humanas: la tarjeta de ec-corp-andina tras el prompt §11 y los chips a 375 px. Las hace el orquestador con Playwright y el LLM falso.

## Problemas encontrados

El directorio de fixtures tiene un `.DS_Store`. El test de chips filtra solo directorios para obtener los cuatro casos.

## Stubs conocidos

Ninguno.

## Self-Check: PASSED

- FOUND: web/src/state/casos.ts, web/src/components/tarjeta-resultado.tsx, web/src/components/acciones-rapidas.tsx, tests/loop/listar-casos.test.ts y tests/web/acciones-rapidas.test.ts
- FOUND: los commits ea06282, dfd9297 y 5a8960b son ancestros de HEAD
