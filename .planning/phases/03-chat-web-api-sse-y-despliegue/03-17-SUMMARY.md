---
phase: 03-chat-web-api-sse-y-despliegue
plan: 17
subsystem: ui
tags: [react, health, llm, banner, sse, d-70, d-71]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-10 pantalla de acceso, config y borrador en el reducer; 03-12 /api/health con llm; 03-13 tope diario con zona; 03-14/03-15 rechazos 429 y 503 con { mensaje }"
provides:
  - "obtenerSalud (GET RUTA_API.SALUD, pública) con validación contra ESTADO_LLM"
  - "useSalud (web/src/hooks/usar-salud.ts): health al cargar, en visibilitychange y tras un turno fallido; sin sondeo"
  - "AvisoModelo: banner role=status bajo el encabezado, oculto en disponible"
  - "Estado del modelo en el Encabezado: punto de 8 px y '{modelo} · {estado}'"
  - "esFalloDeTurno: evento error, rechazos HTTP salvo 401, red caída y stream cortado"
  - "LLM-06, API-03 y el criterio 4 de la fase 3 con la redacción de D-70"
affects: [03-18 y siguientes de la UI (panel de casos, responsive del encabezado), verificación visual de la fase 3, SOLUCION.md]

actuals:
  tokens: 8600
  tasks: 3
  commits: 3
plan_head_before: 02a956e70b93e5f2a448024b1f48812f1adce93a
plan_head_after: 9a1a8d47ef730f8bc5e33bec2e5ffd5afce2fd00

tech-stack:
  added: []
  patterns:
    - "Estado del servidor fuera del reducer de la conversación: useSalud guarda la última respuesta de health y expone refrescar; useChat recibe refrescar como callback de turno fallido"
    - "Tono semántico derivado del estado: TONO_DEL_MODELO (ESTADO_LLM → TONO) y clases CSS .exito/.atencion/.error indexadas por ese tono"
    - "Copia con un comando aparte: PartesAvisoModelo { texto, comando, cierre } pinta bun run demo.ts en <code> sin markdown"

key-files:
  created:
    - web/src/hooks/usar-salud.ts
    - web/src/components/aviso-modelo.tsx
    - web/src/components/aviso-modelo.module.css
    - tests/web/estado-del-modelo.test.ts
  modified:
    - web/src/api/cliente-api.ts
    - web/src/app.tsx
    - web/src/components/encabezado.tsx
    - web/src/components/encabezado.module.css
    - web/src/config/constants/ui.constants.ts
    - web/src/config/strings.ts
    - web/src/hooks/usar-chat.ts
    - web/src/state/conversacion.ts
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - tests/web/cliente-api.test.ts
    - tests/web/conversacion.test.ts
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md

key-decisions:
  - "El hook se exporta como useSalud y no como usarSalud, igual que useChat (03-07): Biome useHookAtTopLevel y React reconocen los hooks por el prefijo use; el archivo sigue siendo web/src/hooks/usar-salud.ts"
  - "La salud vive en useSalud y no en el reducer de la conversación: es estado del servidor, independiente de los turnos, y el reducer sigue sin tocar el navegador (W4)"
  - "useChat avisa el turno fallido con un callback al cerrar el pedido (finally), no con un contador en el estado: así no hace falta un useEffect con una dependencia que Biome marcaría como innecesaria, y health se pide una sola vez, después de turn_end"
  - "Cuenta como turno fallido el evento error, cualquier rechazo HTTP salvo el 401 (413, 429, 503), la red caída y el stream cortado; el 401 pide acceso y no dice nada del modelo"
  - "AvisoModelo deja montada siempre la región role=status y solo pinta el contenido cuando llm ≠ disponible, para que el lector de pantalla anuncie el cambio"
  - "Si health falla o trae otra forma, se conserva la última respuesta válida; antes de la primera respuesta el encabezado no muestra estado del modelo y no hay banner"
  - "El evento visibilitychange y el valor visible van como literales de la API del DOM en usar-salud.ts (como fill=none en los íconos); visibilityState está tipado por TS"

patterns-established:
  - "Un hook de servidor por recurso (useSalud) con refrescar estable (useCallback) y un AbortController por pedido que cancela el anterior"

requirements-completed: [LLM-06, UI-04]

coverage:
  - id: D1
    description: "obtenerSalud pide la ruta pública de health y acepta solo los cinco estados de ESTADO_LLM"
    requirement: "LLM-06"
    verification:
      - kind: unit
        ref: "tests/web/cliente-api.test.ts#acepta cada estado del modelo que el servidor puede reportar"
        status: pass
      - kind: unit
        ref: "tests/web/cliente-api.test.ts#un estado del modelo desconocido o una forma distinta no se aceptan"
        status: pass
    human_judgment: false
  - id: D2
    description: "La copia del encabezado y del banner por estado coincide con el UI-SPEC (tope_diario con la zona de /api/config) y el color sale del estado"
    requirement: "LLM-06"
    verification:
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Un turno con evento error o un rechazo 413/429/503 refresca health una vez; el 401 no"
    requirement: "UI-04"
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#esFalloDeTurno"
        status: pass
    human_judgment: false
  - id: D4
    description: "Un 429 o un 503 muestran el mensaje del servidor tal cual bajo la burbuja y dejan el texto en el compositor"
    requirement: "UI-04"
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#un 429 o un 503 muestran el mensaje del servidor tal cual bajo la burbuja y dejan el texto"
        status: pass
    human_judgment: false
  - id: D5
    description: "El banner y el punto del encabezado se ven bien en cada estado, en el lugar del UI-SPEC, y se refrescan al volver a la pestaña y tras un turno fallido"
    requirement: "LLM-06"
    verification: []
    human_judgment: true
    rationale: "Aspecto visual, orden en la pantalla y eventos del navegador (visibilitychange); no hay DOM en bun test. Lo verifica el orquestador con Playwright contra un servidor con env falso"

duration: 6min
completed: 2026-10-15
status: complete
---

# Phase 3 Plan 17: Estado del modelo en la UI (D-70) Summary

**El campo `llm` de `/api/health` llega a un banner `AvisoModelo` bajo el encabezado y a un punto con "{modelo} · {estado}" en el `Encabezado`. Se consulta solo al cargar, al volver a la pestaña y después de un turno fallido, sin sondeo. Los rechazos 413, 429 y 503 muestran el mensaje del servidor sin perder el borrador.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-10-15T02:32:44Z
- **Completed:** 2026-10-15T02:38:30Z
- **Tasks:** 3
- **Files modified:** 18 (494 inserciones, 21 borrados)

## Accomplishments

- `obtenerSalud()` en `cliente-api.ts` (GET `RUTA_API.SALUD`, ruta pública) valida `{ ok: true, provider, model, llm }` y acepta `llm` solo si es un valor de `ESTADO_LLM`.
- `useSalud()` en `web/src/hooks/usar-salud.ts` pide health al montar y en `visibilitychange` cuando la pestaña queda visible, y expone `refrescar`. No usa `setInterval` ni `setTimeout`, y cada pedido nuevo aborta el anterior.
- `useChat(alFallarTurno)` envuelve el `despachar` del turno. Si alguna acción del turno es un fallo (`esFalloDeTurno`), llama `refrescar` una vez cuando termina el pedido, es decir, después de `turn_end`.
- `AvisoModelo` (`role="status"`, ancho completo, ícono y texto, sin botón de cerrar): `sin_clave` y `saldo_agotado` usan la paleta de error, y `no_disponible` y `tope_diario` la de atención. `tope_diario` rellena `{zona}` con `config.zona` y `sin_clave` pinta `bun run demo.ts` en `<code>`. No pinta nada cuando el estado es `disponible`.
- El `Encabezado` muestra un chip con un punto de 8 px del color semántico más "{modelo} · Disponible / Sin clave / Sin saldo / No disponible / Tope diario". El compositor sigue habilitado en todos los estados (D-70).
- Los rechazos 429 y 503 recorren el mismo camino que el 413: el `mensaje` del servidor va tal cual al `AvisoError` bajo la burbuja, el borrador queda en el compositor y health se refresca. El front no copia ningún texto de rechazo del servidor (`grep -c "Enviaste muchos mensajes" web/src/config/strings.ts` da 0).
- REQUIREMENTS.md (LLM-06 y API-03) y el criterio 4 de la fase 3 en ROADMAP.md tienen ahora la redacción de D-70.

## Task Commits

1. **Task 1: Tracer, el estado del modelo de /api/health llega al banner y al encabezado**: `7c8314e` (feat)
2. **Task 2: Los rechazos 413/429/503 cuentan como turno fallido y conservan el borrador**: `7efa641` (feat)
3. **Task 3: LLM-06, API-03 y el criterio 4 con el alcance de D-70**: `9a1a8d4` (docs)

## Files Created/Modified

- `web/src/hooks/usar-salud.ts`: `useSalud`, que maneja health al cargar, en visibilitychange y en `refrescar`.
- `web/src/components/aviso-modelo.tsx` y `.module.css`: el banner del estado del LLM.
- `web/src/components/encabezado.tsx` y `.module.css`: el chip del estado del modelo con su punto de color.
- `web/src/api/cliente-api.ts`: `obtenerSalud`, `esSalud` y `esEstadoDelModelo`.
- `web/src/state/conversacion.ts`: `esFalloDeTurno`.
- `web/src/hooks/usar-chat.ts`: el callback `alFallarTurno`.
- `web/src/app.tsx`: monta `useSalud`, pasa `refrescar` a `useChat` y pinta `AvisoModelo` entre el encabezado y `main`.
- `web/src/config/constants/ui.constants.ts`: `TONO` y `TONO_DEL_MODELO`.
- `web/src/config/strings.ts`: `TEXTO_MODELO` (etiquetas y banners del UI-SPEC).
- `web/src/types/chat.type.ts` y `ui.type.ts`: `EstadoModelo`, `SaludModelo`, `ControlSalud`, `Tono`, `EstadoModeloConAviso`, `PartesAvisoModelo` y las props.
- `tests/web/estado-del-modelo.test.ts`, `cliente-api.test.ts` y `conversacion.test.ts`: las pruebas nuevas.
- `.planning/REQUIREMENTS.md` y `.planning/ROADMAP.md`: la redacción de D-70.

## Cómo forzar cada estado sin un LLM real (para la verificación con Playwright)

Todos los arranques van con `bun --env-file=/dev/null` para que Bun no cargue el `.env` real, por ejemplo `PORT=3917 NODE_ENV=development ACCESS_CODE=codigo-de-prueba-largo LLM_FALLBACK_ENABLED=false bun --env-file=/dev/null src/server.ts`, después de `bun run build:web` (el servidor sirve `web/dist`). El estado `sin_clave` se comprobó así: `curl localhost:3917/api/health` respondió `{"ok":true,"provider":"deepseek","model":"deepseek-flash","llm":"sin_clave"}`.

| Estado | Cómo forzarlo | Qué se ve |
|---|---|---|
| `sin_clave` | Sin `LLM_API_KEY`/`DEEPSEEK_API_KEY` y `LLM_FALLBACK_ENABLED=false` | Al cargar: banner rojo con `bun run demo.ts` y el encabezado en "deepseek-flash · Sin clave". Al enviar un mensaje: 503 con el mensaje del servidor bajo la burbuja, y el borrador sigue en el compositor |
| `no_disponible` | `LLM_API_KEY=falsa`, `LLM_BASE_URL=http://127.0.0.1:<puerto cerrado>/v1`, `LLM_MODEL=modelo-falso`, `LLM_MAX_RETRIES=0`, `LLM_FALLBACK_ENABLED=false` | Al enviar un mensaje, la conexión es rechazada: evento `error` y `turn_end`. Después se refresca health y aparece el banner ámbar "El proveedor del modelo no respondió…" |
| `saldo_agotado` | Igual, pero con `LLM_BASE_URL` apuntando a un `Bun.serve` local que responde 402 a `POST /chat/completions` | Después del turno con error, banner rojo "…se quedó sin saldo…" y encabezado en "Sin saldo" |
| `tope_diario` | `LLM_BASE_URL` apuntando a un `Bun.serve` local que responde una completion válida (`choices[0].message.content` y `usage` con tokens) y `AGENT_DAILY_TOKEN_BUDGET=1` | Después del primer turno, health pasa a `tope_diario`. El siguiente mensaje recibe un 429 con la zona, y el banner ámbar muestra la zona de `/api/config` (`TZ_NEGOCIO`) |
| 429 de ritmo | `RATE_LIMIT_CHAT_PER_MINUTE=1` y dos mensajes seguidos | El segundo muestra el `mensaje` del servidor y el texto se queda en el compositor |

Para `visibilitychange`, cambia de pestaña y vuelve: se ve un nuevo `GET /api/health` en la red. Al estar abierta la página no debe aparecer ningún pedido periódico.

## Decisions Made

Ver `key-decisions` en el frontmatter. Las principales: el hook se exporta como `useSalud` (convención de 03-07), la salud vive fuera del reducer y el turno fallido se avisa con un callback en el `finally` del pedido.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] El hook se exporta como `useSalud` en vez de `usarSalud`**
- **Found during:** Task 1
- **Issue:** el plan nombra el export `usarSalud`, pero con el nombre en español Biome falla en `useHookAtTopLevel` y deja de vigilar las reglas de hooks, el mismo caso que `useChat` en 03-07.
- **Fix:** el export es `useSalud` y el archivo sigue siendo `web/src/hooks/usar-salud.ts`.
- **Files modified:** web/src/hooks/usar-salud.ts, web/src/app.tsx
- **Verification:** `bun run check` en verde.
- **Committed in:** 7c8314e

**2. [Rule 2 - Missing Critical] La red caída y el stream cortado también refrescan health**
- **Found during:** Task 2
- **Issue:** el plan nombra el evento `error` y los rechazos 429 y 503. La red caída y el stream cortado también cierran el turno con error, y un 413 recorre el mismo camino.
- **Fix:** `esFalloDeTurno` cubre todos los cierres con error salvo el 401, que pide acceso. Sigue siendo un solo pedido por turno, sin sondeo.
- **Files modified:** web/src/state/conversacion.ts
- **Verification:** `tests/web/conversacion.test.ts#esFalloDeTurno`
- **Committed in:** 7efa641

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** el alcance no cambia. Health se sigue pidiendo solo en los tres momentos del UI-SPEC.

## Tracer gate

El `<verify>` del tracer pasó: 91 tests de web y de los guardianes, `build:web` y `bun run check`. El `<human-check>` del Task 1 pedía una clave inválida en `.env` y un mensaje real. No se corrió: arriesga un pedido al proveedor real y el orquestador indicó que la verificación visual la hace después con Playwright contra un servidor con env falso. La tabla de arriba explica cómo forzar cada estado sin LLM real.

## Issues Encountered

- En pantallas angostas (< 640 px), el encabezado todavía no se parte en dos líneas como pide el UI-SPEC. Con el chip del modelo hay más contenido en una sola fila de 56 px. Ese punto le toca al plan del layout responsive (pestañas y panel de casos): W12 prohíbe px sueltos en los módulos y un breakpoint necesita una decisión de tokens.

## User Setup Required

None. No hace falta configurar ningún servicio externo.

## Verificación

- `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts tests/web`: 95 pass, 0 fail.
- `LLM_EN_VIVO=0 bun --env-file=/dev/null test`: 1842 pass, 1 skip, 0 fail.
- `bun run build:web` y `bun run check` (tsc raíz y web, Biome y `bun audit`): en verde.
- Criterios de aceptación: `usar-salud.ts` contiene `visibilitychange` (2) y no tiene timers (0). `aviso-modelo.tsx` contiene `role="status"` (1). `strings.ts` no tiene "Enviaste muchos mensajes" (0). `tope_diario` aparece en REQUIREMENTS.md (1). En la fase 3 del ROADMAP, `demo.ts` aparece 1 vez y "tope diario" 1 vez. API-03 contiene `llm`.

## Next Phase Readiness

- Listo para la verificación visual del orquestador y para los planes siguientes de la UI. `useSalud` y `TONO_DEL_MODELO` quedan disponibles para reutilizarse.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
