---
phase: 03-chat-web-api-sse-y-despliegue
plan: 19
subsystem: ui
tags: [react, sse, tool-calls, details, reducer, accesibilidad, ui-01, ui-02, ca4]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-16 tool_start y tool_end con caso (y resultado); 03-07 LineaDeTiempo, IndicadorPensando e íconos; 03-17 useChat y useSalud"
provides:
  - "Pliegue de tool_start y tool_end en tarjetas por llamadaId dentro de cada turno (LlamadaDelTurno: estado, herramienta, caso, argumentos redactados, resumen y codigo)"
  - "GrupoHerramientas (details) con el resumen singular y plural, que se cierra al terminar el turno si tiene más de MAXIMO_TARJETAS_ABIERTAS (6)"
  - "TarjetaHerramienta (details/summary): fila de 40 px con ícono de estado, etiqueta, caso, badge y resumen con elipsis; el cuerpo muestra el nombre técnico, los argumentos en JSON con sangría 2, el resultado y 'Código: {codigo}'"
  - "Selectores puros en web/src/state/conversacion.ts: resumenDeLlamadas, grupoSeCierraAlTerminar, argumentosLegibles, llamadaEnCurso, anuncioDeEstado, etiquetaPensando y eventosDelTurno"
  - "IndicadorPensando con '{gerundio} · {caso}…' y la línea tenue de servidor despertando a los ESPERA_DESPERTAR_MS (10 s) sin eventos"
  - "Etiquetas y gerundios de herramienta en web/src/config/strings.ts por valor de HERRAMIENTA (TEXTO_HERRAMIENTA)"
affects: [03-20 hidratación de la sesión (los turnos rehidratados necesitan llamadas y eventos), 03-21 TarjetaResultado, 03-22 ProgresoCaso, verificación visual de la fase 3]

actuals:
  tokens: 10700
  tasks: 2
  commits: 3
plan_head_before: 25a46e6fa2bb6817ef1e6c6eca80851ab7472b31
plan_head_after: 9e3457d20eb774e3eadcba092711b84a59c574c3

tech-stack:
  added: []
  patterns:
    - "Un componente hijo con key igual a una marca del estado (AvisoDespertar key={marca}) reinicia un temporizador en cada evento sin useEffect con dependencias que no usa"
    - "El grupo details guarda su apertura en estado, la sincroniza con onToggle y la cierra con un efecto cuando el turno termina con más de seis tarjetas"
    - "La herramienta en curso y el texto del indicador se derivan del estado con selectores, en vez de guardar una herramientaEnCurso aparte"

key-files:
  created:
    - web/src/components/grupo-herramientas.tsx
    - web/src/components/grupo-herramientas.module.css
    - web/src/components/tarjeta-herramienta.tsx
    - web/src/components/tarjeta-herramienta.module.css
    - tests/web/herramientas.test.ts
  modified:
    - web/src/state/conversacion.ts
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/components/linea-de-tiempo.tsx
    - web/src/components/indicador-pensando.tsx
    - web/src/components/indicador-pensando.module.css
    - web/src/app.tsx
    - tests/web/conversacion.test.ts

key-decisions:
  - "La herramienta en curso no se guarda en el estado: llamadaEnCurso la deriva de la última tarjeta En curso del turno abierto. Así no puede desincronizarse de las tarjetas"
  - "Cada turno lleva un contador eventos que sube con todo evento SSE. Es la marca que reinicia la espera de 10 s del aviso de servidor despertando. Por eso un evento usage ya no deja el estado idéntico y se actualizó esa prueba de conversacion.test.ts"
  - "El resumen del grupo concuerda en número: '1 correcta' y '2 correctas'. El UI-SPEC fija la plantilla '{k} correctas', pero '1 correctas' es incorrecto en español. El singular de una sola llamada sigue siendo '1 llamada a herramienta'"
  - "El indicador pone '…' al final de cualquier etiqueta, también la de una herramienta desconocida: 'Ejecutando proveedor_x…' o 'Ejecutando proveedor_x · {caso}…'. Sin caso queda solo el gerundio"
  - "Un tool_end sin tool_start igual crea su tarjeta, ya cerrada y con argumentos null. Un tool_start repetido no duplica la tarjeta"
  - "El summary nativo pierde el marcador con display:flex, así que el grupo y la tarjeta muestran un IconoChevron que gira 90° al abrirse. El comportamiento de teclado sigue siendo el nativo"
  - "El badge En curso usa la paleta Información; el acento queda solo para el ícono girando, como manda la lista cerrada de usos del acento"

patterns-established:
  - "Las tarjetas de herramienta se pliegan por llamadaId dentro del turno, y los selectores de presentación viven en web/src/state y se prueban sin DOM"

requirements-completed: [UI-01, UI-02]

coverage:
  - id: D1
    description: "tool_start abre una tarjeta En curso con caso y argumentos redactados, y tool_end la deja Correcta o Error con resumen y código, en el orden de las llamadas"
    requirement: UI-02
    verification:
      - kind: unit
        ref: "tests/web/herramientas.test.ts#tarjetas de herramienta del turno"
        status: pass
    human_judgment: false
  - id: D2
    description: "El resumen del grupo dice '1 llamada a herramienta' o '{n} llamadas a herramientas · {k} correctas · {e} con error', y el grupo se cierra al terminar el turno solo con más de 6 tarjetas"
    requirement: UI-02
    verification:
      - kind: unit
        ref: "tests/web/herramientas.test.ts#resumen del grupo de herramientas"
        status: pass
    human_judgment: false
  - id: D3
    description: "La tarjeta muestra la etiqueta humana (el nombre técnico si la herramienta es desconocida), los estados En curso, Correcta y Error, los argumentos en JSON con sangría 2 y 'Código: {codigo}'. La región viva anuncia 'Ejecutando {etiqueta} de {caso}'"
    requirement: UI-02
    verification:
      - kind: unit
        ref: "tests/web/herramientas.test.ts#contenido de la tarjeta"
        status: pass
      - kind: unit
        ref: "tests/web/herramientas.test.ts#región viva del turno"
        status: pass
    human_judgment: false
  - id: D4
    description: "El indicador dice 'Pensando…' sin herramienta en curso, 'Mapeando campos · ec-corp-andina…' con mapear_campos en curso, el gerundio de cada herramienta y 'Ejecutando {nombre}' para una desconocida; cada evento mueve la marca de espera"
    requirement: UI-01
    verification:
      - kind: unit
        ref: "tests/web/herramientas.test.ts#indicador pensando"
        status: pass
    human_judgment: false
  - id: D5
    description: "Las tarjetas aparecen en vivo una por una, se expanden con teclado y foco visible, el resumen colapsado se corta con elipsis, el ícono girando cambia por el reloj con movimiento reducido y la línea de servidor despertando aparece a los 10 s sin eventos"
    requirement: UI-02
    verification: []
    human_judgment: true
    rationale: "Aspecto visual, temporizador real, prefers-reduced-motion y eventos del navegador: bun test no tiene DOM. Lo verifica el orquestador con Playwright usando el LLM falso local descrito abajo, sin proveedor real"

duration: 7min
completed: 2026-10-15
status: complete
---

# Phase 3 Plan 19: Tarjetas de herramienta en vivo e indicador con herramienta en curso (UI-01, UI-02) Summary

**Cada tool_start abre en el grupo del turno una tarjeta colapsable (details/summary) con el estado "En curso". Con su tool_end la tarjeta pasa a "Correcta" o "Error". Al expandirla se ven el nombre técnico `proveedor_*`, los argumentos redactados en JSON y el resumen, más el código si la llamada falló. El indicador dice "{gerundio} · {caso}…" y avisa que el servidor puede estar despertando si pasan 10 s sin eventos.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-10-15T02:50:03Z
- **Completed:** 2026-10-15T02:56:56Z
- **Tasks:** 2
- **Files modified:** 15 (972 inserciones, 28 borrados)

## Accomplishments

- `reducirConversacion` pliega `tool_start` y `tool_end` en `turno.llamadas`, con la clave `llamadaId` y el orden de llegada. Cada tarjeta guarda el estado (`ESTADO_HERRAMIENTA`), la herramienta, el caso, los argumentos ya redactados por el bucle, el resumen y el código del fallo.
- `GrupoHerramientas` va entre el mensaje de la usuaria y el texto del agente, en el orden del UI-SPEC. Está abierto mientras corre el turno, su resumen tiene singular y plural, y se cierra solo al terminar el turno si tiene más de 6 tarjetas.
- `TarjetaHerramienta`:
  - La fila colapsada (40 px) tiene el ícono de estado (girando con el acento, check o x), la etiqueta humana en 14/600, el caso en monoespaciada, el badge de estado y el resumen en una sola línea con elipsis.
  - El cuerpo expandido tiene el fondo secundario y muestra "Herramienta", "Argumentos" (en un `<pre>` de 240 px como máximo, con scroll), "Resultado" (`pre-wrap`) y "Código: {codigo}" en color de error cuando `ok` es false.
- La región viva anuncia "Ejecutando Mapear campos de ec-corp-andina" con cada `tool_start` y "Respuesta lista" al cerrar el turno.
- `IndicadorPensando` muestra la etiqueta que calcula `etiquetaPensando` y la línea tenue "El servidor puede estar despertando; la primera respuesta tarda hasta un minuto." cuando pasan `ESPERA_DESPERTAR_MS` sin eventos. La espera se reinicia con cada evento. Con `prefers-reduced-motion` el ícono girando cambia por el reloj.
- Todas las etiquetas, gerundios y textos de estado están en `web/src/config/strings.ts`, con clave en los valores de `HERRAMIENTA`. Una herramienta desconocida muestra su nombre técnico.

## Task Commits

1. **Task 1 (tracer): cada llamada a herramienta aparece en vivo como tarjeta colapsable que termina Correcta o Error (UI-02)**: `ffffe64` (feat)
2. **Task 2 (TDD): el indicador nombra la herramienta y el caso en curso y avisa del servidor despertando (UI-01)**
   - RED: `e903f7d` (test)
   - GREEN: `9e3457d` (feat)

## TDD Gate Compliance (Task 2)

- **RED** (`e903f7d`): se corrió `bun --env-file=/dev/null test tests/web/herramientas.test.ts --reporter=junit`, que terminó con exit 1: 24 pruebas, 20 pasan y 4 fallan. El clasificador `gsd-tools check tdd-red-evidence` dio **RED_EVIDENCE_OK** (`target_test_failed`, formato junit, sin `report_errors`). La prueba objetivo fue "con mapear_campos en curso sobre ec-corp-andina dice Mapeando campos · ec-corp-andina…", con esperado `"Mapeando campos · ec-corp-andina…"` y recibido `"Pensando…"`.
- Para que la falla fuera de aserción y no de carga, el commit RED agregó `etiquetaPensando` y `eventosDelTurno` con el comportamiento de ese momento: siempre "Pensando…" y marca 0. Las otras tres fallas fueron los gerundios por herramienta, "Ejecutando {nombre}" y la marca por evento (esperado 3, recibido 0). Todas son fallas de aserción. Las pruebas "sin herramienta en curso dice Pensando…" y "al cerrar la herramienta vuelve a Pensando…" pasan desde el RED porque describen un comportamiento que ya existía, y quedan como regresión.
- **Evaluación semántica:** la prueba objetivo se ejecutó y falló en la aserción planeada porque el indicador no conocía la herramienta en curso. No hubo errores de carga, sintaxis ni fixtures.
- **GREEN** (`9e3457d`): con los selectores reales, el contador `eventos` por turno, los gerundios y `AvisoDespertar`, pasan las 187 pruebas de web y de los guardianes, y la suite completa da 1878 pass, 1 skip y 0 fail.
- **REFACTOR:** no hizo falta.

## Tracer feedback gate (Task 1)

El `<verify>` automatizado del tracer pasó: `bun test` sobre herramientas, conversacion y arquitectura-web (76 pass), `bun run build:web` y `bun run check`. La configuración es interactiva y `end-of-phase`, y el tracer trae un `<human-check>`, así que según la fila 4 el tracer pedía un checkpoint. El orquestador indicó que la verificación visual la hace después él con Playwright, igual que en 03-10 y 03-17, así que se siguió con la Task 2.

## Cómo ver las tarjetas sin proveedor real (para la verificación con Playwright)

Para ver una tarjeta real hace falta un turno con tool calls. El script `/private/tmp/claude-501/-Users-alejo-Developer-Alejo-reto-eli-1/06902151-236d-4c5b-8c72-68d31ab9ab51/scratchpad/fake-llm-03-19.ts` levanta con `Bun.serve` un `/chat/completions` compatible con OpenAI. No está en el repo. En cada turno devuelve tool_calls guionadas en este orden: `proveedor_leer_solicitud`, `proveedor_mapear_campos`, `proveedor_generar_formulario` (con el mapeo que sale del resultado anterior), `proveedor_armar_paquete` y `proveedor_listar_casos`. La última es una herramienta desconocida y deja una tarjeta Error con `HERRAMIENTA_DESCONOCIDA`. Al final responde texto. El caso sale del mensaje de la usuaria, y si no lo encuentra usa ec-corp-andina.

```bash
SP=/private/tmp/claude-501/-Users-alejo-Developer-Alejo-reto-eli-1/06902151-236d-4c5b-8c72-68d31ab9ab51/scratchpad
FAKE_DELAY_MS=1500 FAKE_FIRST_DELAY_MS=11000 bun --env-file=/dev/null $SP/fake-llm-03-19.ts &
NODE_ENV=development PORT=3000 ACCESS_CODE=codigo-local-de-prueba \
  LLM_PROVIDER=falso LLM_BASE_URL=http://127.0.0.1:4010 LLM_MODEL=modelo-falso LLM_API_KEY=clave-falsa \
  bun --env-file=/dev/null src/server.ts &
bun --bun vite --config web/vite.config.ts --configLoader native
```

- Con `FAKE_FIRST_DELAY_MS=11000` la primera respuesta tarda más de 10 s, y así se ve la línea de servidor despertando bajo "Pensando…". Con `FAKE_DELAY_MS=1500` las tarjetas aparecen una por una.
- Se probó el camino completo por SSE con `curl`, con el server en el puerto 3019 y el LLM falso en el 4010: llegaron 5 pares `tool_start`/`tool_end`, 4 con `ok: true` y la desconocida con `ok: false` y `HERRAMIENTA_DESCONOCIDA`, y después `text`, `confirmation_required` y `turn_end`. Los dos procesos quedaron detenidos.
- La etiqueta "{gerundio} · {caso}…" del indicador dura lo que tarda la herramienta local (milisegundos), así que en pantalla casi no se ve. Las pruebas puras la cubren.

## Files Created/Modified

- `web/src/state/conversacion.ts`: el pliegue de tarjetas, el contador `eventos` por turno y los selectores `resumenDeLlamadas`, `grupoSeCierraAlTerminar`, `argumentosLegibles`, `llamadaEnCurso`, `anuncioDeEstado` (antes estaba en linea-de-tiempo.tsx), `etiquetaPensando` y `eventosDelTurno`.
- `web/src/types/chat.type.ts`: `EstadoHerramienta`, `LlamadaDelTurno`, `ResumenLlamadas`, los eventos de herramienta de la UI y `VistaTurnos`. `TurnoConversacion` suma `llamadas` y `eventos`.
- `web/src/types/ui.type.ts`: las props del grupo, de la tarjeta, del ícono de estado y del indicador, y `PropsTurno.enCurso`.
- `web/src/config/strings.ts`: `TEXTO_HERRAMIENTA` (etiqueta, gerundio, estado, grupo, rótulos, código y anuncio), `TEXTO_CHAT.pensandoEn` y `TEXTO_CHAT.despertando`.
- `web/src/config/constants/ui.constants.ts`: `ESTADO_HERRAMIENTA`, `MAXIMO_TARJETAS_ABIERTAS`, `SANGRIA_JSON` y `ESPERA_DESPERTAR_MS`.
- `web/src/components/grupo-herramientas.tsx` y `.module.css`, y `web/src/components/tarjeta-herramienta.tsx` y `.module.css`: los componentes nuevos.
- `web/src/components/linea-de-tiempo.tsx`: pinta el grupo dentro de cada turno y avisa a cada turno si está en curso.
- `web/src/components/indicador-pensando.tsx` y `.module.css`: la etiqueta por props y `AvisoDespertar`.
- `web/src/app.tsx`: le pasa al indicador `etiquetaPensando(estado)` y `eventosDelTurno(estado)`.
- `tests/web/herramientas.test.ts` (nuevo, 24 pruebas) y `tests/web/conversacion.test.ts`, donde se ajustó una prueba.

## Decisions Made

Están en `key-decisions` del frontmatter. Las más visibles para la usuaria son dos: el grupo concuerda en número ("1 correcta"), y una herramienta desconocida muestra su nombre técnico tanto en la tarjeta como en el indicador.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Se ajustó la prueba "los eventos que la pantalla todavía no pinta no cambian el estado"**
- **Found during:** Task 2 (GREEN)
- **Issue:** la prueba de 03-03 esperaba que un evento `usage` dejara el estado idéntico. El plan pide que la espera del aviso de despertar se reinicie con cualquier evento, así que todo evento mueve la marca `eventos` del turno.
- **Fix:** la prueba ahora se llama "…solo mueven la marca de eventos del turno" y comprueba que el estado es igual salvo `eventos + 1`.
- **Files modified:** tests/web/conversacion.test.ts
- **Verification:** 187 pruebas de web y guardianes en verde, y la suite completa también.
- **Committed in:** `9e3457d`

**2. [Nota] El RED de la Task 2 trae dos selectores con el comportamiento de ese momento**
- Con un export inexistente el archivo de pruebas fallaba al cargar, y esa falla no vale como RED. Por eso `etiquetaPensando` (siempre "Pensando…") y `eventosDelTurno` (0) entraron en el commit RED, y el GREEN los reemplazó.

**3. [Nota] El gate del tracer no se detuvo en el `<human-check>`**
- Fue por indicación del orquestador. La explicación está en la sección "Tracer feedback gate".

---

**Total deviations:** 1 auto-fixed (Rule 1) y 2 notas de proceso.
**Impact on plan:** ninguno sobre el alcance. El cambio de la prueba es consecuencia directa del requisito de la marca por evento.

## Issues Encountered

- `CODIGO_AGENTE.ARGUMENTOS_INVALIDOS` no existe. La prueba usa `CODIGO_ERROR.CASO_NO_ENCONTRADO`, un código real de herramienta. Se vio antes del commit porque `bun test` no hace el chequeo de tipos.
- Si un turno se corta (stream cortado o error) mientras una herramienta está en curso, su tarjeta queda "En curso". El UI-SPEC no define un estado "interrumpida". Cuando 03-20 rehidrate la sesión, la tarjeta quedará en el estado que diga el historial.

## Known Stubs

Ninguno. Los stubs del RED se reemplazaron en el GREEN.

## User Setup Required

None. No hace falta configurar ningún servicio externo.

## Next Phase Readiness

- 03-20 (hidratación de la sesión) tiene que construir los turnos con `llamadas` y `eventos: 0` para que el grupo y las tarjetas se pinten igual desde el historial. Un grupo hidratado con más de 6 tarjetas arranca cerrado.
- 03-21 y 03-22 pueden leer `turno.llamadas` (con caso y estado) para `TarjetaResultado` y `ProgresoCaso`. El `resultado` estructurado de `tool_end` todavía no se guarda en la tarjeta, porque esta UI no lo usa.
- Falta la verificación visual (D5), que hace el orquestador con Playwright y el LLM falso local.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
