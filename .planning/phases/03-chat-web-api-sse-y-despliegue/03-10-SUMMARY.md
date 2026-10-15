---
phase: 03-chat-web-api-sse-y-despliegue
plan: 10
subsystem: ui
tags: [react, acceso, cookie-httponly, api-config, compositor, tdd]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "POST /api/acceso con cookie HttpOnly (03-04, 03-06), GET /api/config con fechaEjecucion y mensajeMaximo (03-08, 03-09), 413 del chat (03-09), useChat y Compositor (03-07)"
provides:
  - "web/src/api/cliente-api.ts: obtenerConfig y entrar, con todo 401 como acceso vencido"
  - "PantallaAcceso de la UI-SPEC delante del chat (D-72)"
  - "Chip 'Fecha de ejecución {fecha}' en el Encabezado desde /api/config (UI-09)"
  - "Estado de acceso y config en el reductor: un 401 vuelve a la pantalla de acceso y conserva sesionId y borrador"
  - "Compositor con maxlength y contador desde mensajeMaximo; el borrador se vacía solo cuando el servidor acepta"
affects: [03-11, 03-25, 03-26, despliegue, chat-web]

actuals:
  tokens: 13200
  tasks: 2
  commits: 3
plan_head_before: fa87f74ca4205f5634aead06b4d10771fd40ca14
plan_head_after: 40bbf84378f3717891c0c5a902f2cfbf9ab7c835

tech-stack:
  added: []
  patterns:
    - "ResultadoApi<T> (ok | acceso_vencido | rechazo | sin_red) como única forma de respuesta del cliente HTTP del front"
    - "El acceso, la config y el borrador viven en el reductor puro de la conversación; React solo despacha"
    - "Media queries en em (40em) porque W12 prohíbe px sueltos y las variables CSS no valen en @media"

key-files:
  created:
    - web/src/api/cliente-api.ts
    - web/src/components/pantalla-acceso.tsx
    - web/src/components/pantalla-acceso.module.css
    - tests/web/cliente-api.test.ts
  modified:
    - web/src/api/flujo-chat.ts
    - web/src/state/conversacion.ts
    - web/src/hooks/usar-chat.ts
    - web/src/app.tsx
    - web/src/components/encabezado.tsx
    - web/src/components/encabezado.module.css
    - web/src/components/compositor.tsx
    - web/src/components/compositor.module.css
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - tests/web/conversacion.test.ts
    - tests/web/flujo-chat.test.ts
    - docs/estructura.md

key-decisions:
  - "El acceso (verificando, pedido con aviso o concedido) y la config viven en el reductor de la conversación, para que el 401 del chat y el 401 de la carga usen una sola fuente de verdad que se pueda probar sin React"
  - "Un 401 del chat quita el turno que el servidor no recibió, conserva sesionId, la conversación anterior y el borrador, y lleva a PantallaAcceso con el mensaje accesoVencido del servidor"
  - "Al cargar, un 401 de /api/config muestra la pantalla de acceso sin aviso de vencimiento; otro fallo abre el chat sin config (fecha '—', sin maxlength) y un 401 posterior pide el código"
  - "El borrador pasa al reductor: ENVIAR no lo vacía, ACEPTADO (respuesta 2xx de /api/chat) lo vacía solo si sigue siendo el texto enviado, y todo rechazo lo deja en el compositor"
  - "La copia 'Tu acceso venció…' existe también en el front como respaldo, solo para un 401 sin mensaje legible; la ayuda deriva las 12 horas de VIGENCIA_ACCESO_HORAS_POR_DEFECTO"

patterns-established:
  - "Cliente HTTP del front: pedir() + resultadoDelRechazo() compartidos por cliente-api y flujo-chat"
  - "Los textos con datos se arman con funciones en strings.ts (fechaEjecucion, contador)"

requirements-completed: [UI-09, UI-04]

coverage:
  - id: D1
    description: "cliente-api: obtenerConfig y entrar convierten todo 401 en acceso vencido, otro rechazo en el mensaje del servidor y una config con otra forma en sin red"
    requirement: UI-09
    verification:
      - kind: unit
        ref: "tests/web/cliente-api.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Un 401 del chat lleva al estado de acceso pedido con el aviso del servidor, conserva sesionId y la conversación anterior, y la config recibida después regresa al chat"
    requirement: UI-09
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#ERROR_HTTP 401 pide el acceso con el mensaje del servidor y conserva el sessionId"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#volver a recibir la config después del 401 regresa al chat con la misma sesión"
        status: pass
      - kind: unit
        ref: "tests/web/flujo-chat.test.ts#un 401 sin mensaje legible despacha ERROR_HTTP 401 con la copia de acceso vencido"
        status: pass
    human_judgment: false
  - id: D3
    description: "El borrador sobrevive a 413, 429, sin red y 401, y se vacía solo cuando el servidor acepta el pedido"
    requirement: UI-04
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#el borrador del compositor"
        status: pass
      - kind: unit
        ref: "tests/web/flujo-chat.test.ts#un turno completo despacha ACEPTADO, sus eventos y no despacha FIN_STREAM"
        status: pass
    human_judgment: false
  - id: D4
    description: "PantallaAcceso visible: tarjeta de 400 px, botón deshabilitado con el campo vacío, 'Verificando…', error rojo con foco de vuelta, Mostrar/Ocultar, recarga directa al chat y vuelta a la pantalla con 'Tu acceso venció…'"
    requirement: UI-09
    verification:
      - kind: other
        ref: "curl contra bun src/server.ts con entorno falso: /api/config 401 sin cookie, /api/acceso 401 con código malo y 204 con el bueno, /api/config 200 con la cookie"
        status: pass
    human_judgment: true
    rationale: "La apariencia y el flujo en el navegador (foco, colores, recarga con la cookie HttpOnly) los verifica el orquestador con Playwright"
  - id: D5
    description: "Chip 'Fecha de ejecución {fecha}' en el encabezado y contador '{n}/{max}' del compositor en color de error en el máximo"
    requirement: UI-04
    verification:
      - kind: other
        ref: "bun run build:web && bun run check"
        status: pass
    human_judgment: true
    rationale: "La presentación del chip y del contador es visual; la verifica el orquestador con Playwright"

duration: 9min
completed: 2026-10-15
status: complete
---

# Fase 03 Plan 10: pantalla de acceso, fecha efectiva y compositor con el límite del servidor

**La SPA ahora pide el código de acceso una sola vez en la PantallaAcceso de la UI-SPEC y la cookie HttpOnly de 12 horas mantiene a la analista adentro. Cualquier 401 la devuelve a esa pantalla con "Tu acceso venció…", sin perder la sesión ni lo que escribió. El encabezado muestra la fecha de ejecución del servidor. El compositor toma el máximo de `/api/config` para el `maxlength` y el contador, y vacía el borrador solo cuando el servidor acepta el mensaje.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-10-15T00:54:30Z
- **Completed:** 2026-10-15T01:03:30Z
- **Tasks:** 2
- **Files modified:** 19 (4 creados)

## Accomplishments

- `cliente-api.ts`: `obtenerConfig(signal)` y `entrar(codigo)` devuelven `ResultadoApi<T>`. Un 401 se vuelve `acceso_vencido` con el `mensaje` del servidor (o la copia del front si el 401 llega sin cuerpo legible). Otro rechazo con mensaje se vuelve `rechazo`, y sin red o con una config que no tiene la forma esperada se vuelve `sin_red`. `flujo-chat` reutiliza `pedir` y `resultadoDelRechazo`.
- `PantallaAcceso`: es un `main` con un `form` en una tarjeta de 400 px centrada. Tiene el título display "Acceso al agente", la ayuda, el campo `password` con `autoComplete="current-password"` y el botón "Mostrar código"/"Ocultar código". "Entrar al agente" está deshabilitado con el campo vacío y dice "Verificando…" mientras la petición está en curso. El error del servidor (401 o 429) aparece bajo el campo con `aria-invalid` y `aria-describedby`, y el foco vuelve al campo. El foco inicial también va al campo. El código solo existe en el estado del componente y se vacía al entrar.
- Estado: `EstadoConversacion` suma `acceso`, `config` y `borrador`. `ERROR_HTTP` con 401 quita el turno no recibido, cierra el turno en curso y pasa a `acceso: pedido` con el aviso del servidor. Conserva `sesionId`, la conversación anterior y el borrador. `CONFIG_RECIBIDA` vuelve al chat.
- `App`: al cargar, llama a `obtenerConfig`. Con 200 abre el chat con la config, y con 401 muestra PantallaAcceso. Mientras verifica, renderiza un `main` con un estado oculto "Cargando el agente…". Después de un `entrar` exitoso, vuelve a pedir la config.
- `Encabezado`: el chip neutro dice "Fecha de ejecución {fechaEjecucion}", o "Fecha de ejecución —" si la config no llegó. La fecha nunca sale del reloj del navegador.
- `Compositor`: el `maxLength` es `mensajeMaximo` del servidor. El contador "{n}/{max}" aparece desde `max − MARGEN_AVISO_CONTADOR` (200) y en el máximo se pinta en el color de error, en 600. Cuando está visible, el contador se suma al `aria-describedby`. El front no tiene ningún "2000" escrito.

## Task Commits

1. **Task 1 (tracer): la analista entra con el código una vez y llega al chat con la fecha efectiva**: `9a2b188` (feat)
2. **Task 2 (TDD): el compositor conoce el límite del servidor y no pierde el borrador**
   - RED: `cd14933` (test)
   - GREEN: `40bbf84` (feat)

Gate del tracer: se volvió a correr el `<verify>` automatizado (`bun test tests/web/conversacion.test.ts tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts`, `bun run build:web` y `bun run check`, todo en verde) antes de expandir. El `<human-check>` del tracer no detuvo la ejecución: según la indicación del orquestador, lo verifica él después con Playwright (ver "Verificación visual pendiente").

## TDD Gate Compliance

- **RED** (`cd14933`): `bun --env-file=/dev/null test tests/web/conversacion.test.ts --reporter=junit`. `gsd-tools check tdd-red-evidence` dio `RED_EVIDENCE_OK` (`target_test_failed`, formato junit, 25 pruebas: 17 pasan y 8 fallan). Evaluación semántica: la prueba objetivo "ERROR_HTTP 413 deja el texto en el compositor y el mensaje del servidor bajo la burbuja" se ejecutó y falló en la aserción planeada (`expect(estado.borrador).toBe(MENSAJE)`, que recibió `undefined`) porque el estado todavía no tenía borrador. Las otras siete fallas son las pruebas nuevas del borrador y la forma exacta del estado inicial, y fallaron por la misma razón. No hubo errores de carga, de sintaxis ni de fixture. En el mismo commit, `flujo-chat.test.ts` espera `ACEPTADO` antes de los eventos.
- **GREEN** (`40bbf84`): `bun test tests/web tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts` da 80 pass. `bun run build:web` y `bun run check` salen con 0, y la suite completa (`bun --env-file=/dev/null test`) da 1728 pass, 1 skip y 0 fail.
- **REFACTOR**: no hizo falta.

## Files Created/Modified

- `web/src/api/cliente-api.ts`: `pedir`, `resultadoDelRechazo`, `obtenerConfig` y `entrar`, más la guarda de forma de `ConfigResponse`.
- `web/src/api/flujo-chat.ts`: usa el cliente compartido y despacha `ACEPTADO` con una respuesta 2xx.
- `web/src/state/conversacion.ts`: `accionDeConfig`, el acceso, la config, el borrador y el 401.
- `web/src/hooks/usar-chat.ts`: el borrador sale del reductor y `recibirConfig` es estable (`useCallback`).
- `web/src/app.tsx`: carga la config y elige entre verificando, PantallaAcceso y chat.
- `web/src/components/pantalla-acceso.tsx` y `.module.css`: la pantalla de acceso.
- `web/src/components/encabezado.tsx` y `.module.css`: el chip de fecha.
- `web/src/components/compositor.tsx` y `.module.css`: `maxLength` y contador.
- `web/src/config/strings.ts`: `TEXTO_ACCESO`, `TEXTO_APP.fechaEjecucion`, `TEXTO_APP.cargando` y `TEXTO_CHAT.contador`.
- `web/src/config/constants/ui.constants.ts`: `ESTADO_ACCESO`, `RESULTADO_API`, las acciones `CONFIG_RECIBIDA`, `ACCESO_PEDIDO`, `CAMBIAR_BORRADOR` y `ACEPTADO`, `MARGEN_AVISO_CONTADOR` y `PEDIDO_JSON`.
- `web/src/types/chat.type.ts` y `web/src/types/ui.type.ts`: `EstadoAcceso`, `ResultadoApi`, `ResultadoFallido`, las acciones nuevas, `PropsEncabezado`, `PropsPantallaAcceso` y `PropsCompositor.maximo`.
- `tests/web/cliente-api.test.ts` (nuevo), `tests/web/conversacion.test.ts` y `tests/web/flujo-chat.test.ts`.
- `docs/estructura.md`: `cliente-api`, `PantallaAcceso`, el chip de fecha y la excepción de la copia de acceso vencido.

## Decisions Made

Ver `key-decisions` en el frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Pruebas del cliente HTTP del front**
- **Found during:** Task 1
- **Issue:** El plan solo pedía la prueba del 401 en el reductor. La conversión de 401, 429, cuerpo ilegible y config malformada en `cliente-api` quedaba sin cubrir.
- **Fix:** Se agregó `tests/web/cliente-api.test.ts` (8 casos) y en `flujo-chat.test.ts` el caso del 401 sin cuerpo.
- **Commit:** `9a2b188`

**2. [Rule 3 - Blocking] `PEDIDO_CHAT` pasa a `PEDIDO_JSON` y se retira `ACCIONES_QUE_DEVUELVEN_EL_BORRADOR`**
- **Found during:** Tasks 1 y 2
- **Issue:** El acceso necesita el mismo POST JSON que el chat. Además, el borrador pasó al reductor, así que el hook ya no devuelve el texto según el tipo de acción.
- **Fix:** El chat y el acceso comparten `PEDIDO_JSON`, y `ACEPTADO` reemplaza al conjunto de acciones que devolvían el borrador.
- **Commits:** `9a2b188`, `40bbf84`

**3. [Rule 3 - Blocking] La media query de la tarjeta usa `40em` en vez de `640px`**
- **Found during:** Task 1
- **Issue:** W12 (`tests/arquitectura-web.test.ts`) prohíbe los px sueltos en los módulos CSS, y una variable CSS no vale dentro de `@media`.
- **Fix:** `@media (min-width: 40em)` (640 px a 16 px) aplica el margen superior de 64 px (`--espacio-3xl`).
- **Commit:** `9a2b188`

**4. [Nota] Criterio `autocomplete="current-password"`**
- En JSX el atributo se escribe `autoComplete="current-password"`, y React lo renderiza como `autocomplete`. Con `grep -i`, el criterio se cumple.

**5. [Nota] El gate del tracer no se detuvo en el `<human-check>`**
- La configuración es interactiva y `end-of-phase`, así que con un `<human-check>` el tracer pedía un checkpoint. El orquestador indicó que la verificación visual la hace él después con Playwright. Por eso se volvió a correr el `<verify>` automatizado, que pasó, y se siguió con la Tarea 2.

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 blocking) y 2 notas.
**Impact on plan:** sin dependencias nuevas ni cambios de alcance. `docs/estructura.md` se actualizó aunque no estaba en `files_modified`.

## Verificación visual pendiente (orquestador, Playwright)

Arranque sugerido: el servidor con `NODE_ENV=development ACCESS_CODE=<código de 12+ caracteres> DEEPSEEK_API_KEY=<clave falsa> FECHA_EJECUCION=2026-09-03`. El servidor no arranca sin una clave de proveedor, pero una clave falsa basta mientras no se mande un mensaje con acceso válido. Precaución: `bun run dev` lanza subprocesos `bun` que pueden cargar el `.env` local por su cuenta. Lo seguro es exportar explícitamente todas las variables del proveedor, o levantar `bun --env-file=/dev/null src/server.ts` y Vite por separado.

Estados visibles sin ningún turno del LLM:

1. **Primera visita, sin cookie:** "Acceso al agente", la ayuda con "12 horas", el campo con el foco y "Entrar al agente" deshabilitado.
2. **Al escribir:** el botón se habilita. "Mostrar código" cambia el campo a texto y el botón pasa a "Ocultar código".
3. **Código incorrecto:** el campo queda con borde rojo, `aria-invalid="true"` y "El código no es válido. Revísalo y vuelve a intentarlo." debajo, y el foco vuelve al campo.
4. **Cinco intentos fallidos:** aparece el 429 "Demasiados intentos fallidos. Espera 15 minutos y vuelve a intentarlo." en el mismo lugar.
5. **"Verificando…":** dura lo que tarda `POST /api/acceso` en local (milisegundos), así que es difícil de capturar sin frenar la red.
6. **Código correcto:** el chat con el chip "Fecha de ejecución 2026-09-03" a la derecha del encabezado. El campo de código ya no existe.
7. **Recarga:** con la cookie de 12 h va directo al chat, sin pedir el código.
8. **Acceso vencido:** borrar las cookies (la cookie es HttpOnly, así que se usa `context.clearCookies()`) y mandar un mensaje. El 401 lo devuelve el middleware de acceso antes del agente, así que no hay llamada al LLM. Se ve PantallaAcceso con el aviso "Tu acceso venció. Escribe el código de nuevo para seguir." y, después de entrar, el mensaje sigue en el compositor.
9. **Contador:** con 1800 o más caracteres en el compositor aparece "{n}/2000", y en 2000 se pinta en rojo. Con `MAX_MESSAGE_CHARS=300`, el contador aparece desde 100. No hace falta enviar.

Mandar un mensaje **con** acceso válido sí llega al proveedor, así que no se debe hacer durante la verificación.

Comprobado por curl contra `bun --env-file=/dev/null src/server.ts` con entorno falso y sin mensajes de chat: `/api/config` sin cookie da 401 con el mensaje accesoVencido, `/api/acceso` con un código malo da 401 con codigoInvalido y con el correcto da 204 con la cookie, y `/api/config` con la cookie da 200 con la forma que valida `esConfig`.

## Issues Encountered

- `bun audit` dentro de `bun run check` muestra `".env"` porque Bun carga el archivo. No hace llamadas al proveedor.

## User Setup Required

Ninguno.

## Next Phase Readiness

- El link público del plan 03-11 ya es usable desde el navegador: se pide el código una vez y vale por 12 horas.
- El `sessionId` todavía vive solo en memoria (en el reductor). Cuando el plan 03-25 lo pase a `localStorage` (`sesion-local.ts`), el 401 ya lo conserva.
- La línea de uso de la sesión ("Uso de la sesión: {k} k de {presupuesto}") puede tomar `config.presupuestoSesion` del mismo estado.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
