---
phase: 03-chat-web-api-sse-y-despliegue
reviewed: 2026-10-15T18:21:57Z
depth: standard
files_reviewed: 63
files_reviewed_list:
  - docs/limites-del-demo.md
  - render.yaml
  - src/config/constants/confirmation.constants.ts
  - src/config/constants/http.constants.ts
  - src/config/constants/llm.constants.ts
  - src/config/strings.ts
  - src/domain/builders/cierre-turno.builder.ts
  - src/domain/policies/compuerta.policy.ts
  - src/domain/types/compuerta.type.ts
  - src/http/routes/chat.route.ts
  - src/http/services/rate-limiter.service.ts
  - src/http/types/server.type.ts
  - src/loop/schemas/resultado-herramienta.schema.ts
  - src/loop/services/bitacora-turno.service.ts
  - src/loop/services/cierre-turno.service.ts
  - src/loop/services/guardado-turno.service.ts
  - src/loop/services/paso-herramientas.service.ts
  - src/loop/types/turno.type.ts
  - tests/despliegue/contrato-despliegue.test.ts
  - tests/http/chat.test.ts
  - tests/http/topes.test.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/loop/compuerta.test.ts
  - tests/loop/listar-casos.test.ts
  - tests/unit/cierre-turno.builder.test.ts
  - tests/unit/compuerta.policy.test.ts
  - tests/unit/despacho-llamada.service.test.ts
  - tests/unit/health-report.decorator.test.ts
  - tests/unit/rate-limiter.service.test.ts
  - tests/unit/vista-sesion.service.test.ts
  - tests/web/acciones-rapidas.test.ts
  - tests/web/archivos.test.ts
  - tests/web/conversacion.test.ts
  - tests/web/estado-del-modelo.test.ts
  - tests/web/flujo-chat.test.ts
  - tests/web/progreso.test.ts
  - tests/web/seguimiento.test.ts
  - web/src/api/flujo-chat.ts
  - web/src/app.tsx
  - web/src/components/acciones-rapidas.module.css
  - web/src/components/acciones-rapidas.tsx
  - web/src/components/aviso-modelo.module.css
  - web/src/components/aviso-modelo.tsx
  - web/src/components/compositor.tsx
  - web/src/components/dialogo-vista-previa.module.css
  - web/src/components/dialogo-vista-previa.tsx
  - web/src/components/encabezado.module.css
  - web/src/components/encabezado.tsx
  - web/src/components/linea-de-tiempo.module.css
  - web/src/components/linea-de-tiempo.tsx
  - web/src/components/panel-casos.tsx
  - web/src/components/tarjeta-confirmacion.tsx
  - web/src/config/constants/ui.constants.ts
  - web/src/config/strings.ts
  - web/src/hooks/usar-chat.ts
  - web/src/hooks/usar-salud.ts
  - web/src/state/casos.ts
  - web/src/state/conversacion.ts
  - web/src/state/modelo.ts
  - web/src/state/seguimiento.ts
  - web/src/state/vista-previa.ts
  - web/src/types/chat.type.ts
  - web/src/types/ui.type.ts
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Fase 3: Informe de revisión de código (re-revisión incremental, planes 03-28..03-39)

**Revisado:** 2026-10-15T18:21:57Z
**Profundidad:** standard
**Archivos revisados:** 63
**Estado:** issues_found

## Resumen

Esta re-revisión cubre lo que cambiaron los planes de cierre de brechas de la UAT (03-28 a 03-39) desde `3a9f0fc`. Revisé los hunks de `git diff 3a9f0fc..HEAD` y leí completos los archivos de producción del alcance. Para verificar D-76 seguí la cadena entre módulos `despacharLlamada → turno.eventosCompuerta/llamadas → cerrarCompuerta → desenlacesDeEnvio → cierreDelTurno → emitirCierre / respuestaDeTurno`. `bun test` pasa (2234 pass, 1 skip) y `bun run check` también (tsc, Biome y `bun audit`). No se hizo ninguna llamada real al LLM.

**Decisiones humanas verificadas:**

- **G-03-15, opción C+ (D-70, D-71.1):**
  - La UI ya no menciona `demo.ts` ni ningún comando. Lo comprobé con un grep sobre `web/src`.
  - El envío se pausa solo en `sin_clave` y `tope_diario` (`ESTADOS_LLM_SIN_ENVIO`). La pausa llega a todos los controles: el compositor, los chips, el chip de reproceso (`AvisoDiscoEfimero`) y los botones de las tarjetas.
  - "Comprobar de nuevo" solo relee `/api/health`.
  - Un 401/403 se publica como `sin_clave`.
  - Health se refresca al cargar, en `visibilitychange` y al terminar cada pedido de chat (`enviarTurno … finally`). No se refresca por intervalo.
  - El servidor sigue siendo la compuerta, porque `chat.route.ts` solo corta con `agente === null` y `TOPE_DIARIO`.
- **G-03-26 (D-76):**
  - `cierreDelTurno` agrega el aviso determinista después del texto del modelo y antes de la pregunta del servidor.
  - No reemplaza la prosa del modelo: solo quita la pregunta final, y solo cuando hay pendientes, como ya hacía D-44.
  - Los avisos se deduplican por texto y `SIN_CASO` sale una sola vez.
  - Un turno abortado no produce avisos.
  - `gate_blocked` y `gate_permit` registran el caso cuando cumple `PATRON_CASO`.
  - El aviso llega igual por SSE y por el respaldo JSON (`tests/http/chat.test.ts`).

No encontré defectos BLOCKER. Quedan tres WARNING:

1. El desalojo del limitador de tasa falla abierto y levanta bloqueos de fuerza bruta.
2. "Nueva sesión" ya no olvida el `sessionId` en `localStorage`, así que al recargar vuelve la sesión anterior con sus tarjetas de confirmación activas. Eso contradice el diálogo.
3. El seguimiento del scroll ignora desplazamientos legítimos de la usuaria que ocurren fuera de la ventana de 600 ms, y el `ResizeObserver` la devuelve al final mientras lee.

## Hallazgos narrativos (revisor IA)

## Warnings

### WR-01: El desalojo por `maxKeys` levanta bloqueos activos (falla abierto), también el anti fuerza bruta de `/api/acceso`

**Archivo:** `src/http/services/rate-limiter.service.ts:15-18,29` (y `tests/unit/rate-limiter.service.test.ts:115-125`, que fija este comportamiento)

**Problema:** cuando el mapa llega a `MAX_CLAVES_LIMITADOR` (10 000), cada clave nueva desaloja la más antigua con `evictOldest()`, sin mirar si esa clave está bloqueada. La clave más antigua es justamente la que primero agotó sus intentos. El test lo hace explícito:

```ts
golpear(limitador, CLAVE, LIMITE);
...
limitador.hit(TERCERA_CLAVE);
expect(limitador.isLocked(CLAVE)).toBe(false);
```

El mismo limitador protege `failedAttempts` (`server.wiring.ts:112-117`, 5 intentos cada 15 min). Las IPv6 se agrupan por `/64` (`GRUPOS_PREFIJO_IPV6 = 4`), y un atacante con un bloque `/48` dispone de 65 536 claves. Si rota más de 10 000 claves, desaloja sus propias claves bloqueadas y vuelve a tener 5 intentos en cada una, en cada vuelta. El tope deja de ser de 5 × N intentos por ventana y pasa a no tener límite, salvo el throughput. El código de acceso mide al menos 12 caracteres, así que no es una explotación inmediata, pero es una defensa en profundidad que falla abierta en silencio. `docs/limites-del-demo.md` tampoco lo documenta: solo menciona el reinicio.

**Arreglo:** que el desalojo nunca suelte una clave bloqueada. Hay dos formas: desalojar la clave no bloqueada más antigua, o, si todas están bloqueadas, no admitir la clave nueva y tratarla como bloqueada (falla cerrado):

```ts
function evictOldestUnlocked(): boolean {
  for (const [key, window] of windows) {
    if (window.count < options.limit) {
      windows.delete(key);
      return true;
    }
  }
  return false;
}

hit(key) {
  const now = options.now();
  sweep(now);
  const existing = windows.get(key);
  if (existing === undefined && windows.size >= options.maxKeys && !evictOldestUnlocked()) return false;
  ...
}
```

Además, cambiar el test para que exija `isLocked(CLAVE) === true` después del desalojo, y agregar una fila en `docs/limites-del-demo.md`.

### WR-02: "Nueva sesión" ya no olvida el `sessionId` guardado: al recargar vuelve la sesión anterior con sus confirmaciones activas, contra lo que promete el diálogo

**Archivos:** `web/src/hooks/usar-chat.ts:113-116`, `web/src/state/conversacion.ts:274-282` y `web/src/config/strings.ts:114`

**Problema:** el plan 03-38 quitó `olvidarSesion()` de `nuevaSesion()`. Ahora `localStorage` conserva el id viejo hasta el `turn_start` de la sesión nueva. Si la analista confirma "Nueva sesión" y recarga la página (o abre otra pestaña) antes de mandar un mensaje, `estadoAlCargar(leerSesionGuardada())` vuelve a hidratar la sesión anterior. `GET /api/sessions/:id` devuelve sus pendientes vigentes (D-69), así que reaparecen las tarjetas de confirmación con los botones Confirmar y Cancelar activos. El diálogo que la analista acaba de aceptar dice: *"La conversación actual sale de esta pantalla y las confirmaciones pendientes se descartan."* La analista cree que descartó un envío que en realidad sigue a un clic de distancia.

El flujo de D-73.5.1 ("Volver a la sesión anterior" ante un 429) no necesita esa persistencia: usa `estado.sesionAnterior`, que vive en memoria.

**Arreglo:** hay dos opciones.

- **Opción 1 (recomendada):** volver a olvidar el id guardado en `nuevaSesion()` y que "Volver a la sesión anterior" lo restaure solo cuando la hidratación funcione. `guardarSesionId` en `HIDRATAR` o en `volverASesionAnterior` basta, porque el id anterior sigue en memoria:

  ```ts
  function nuevaSesion(): void {
    if (estado.enCurso || turnoActivo.current !== null) return;
    olvidarSesion();
    despachar({ tipo: ACCION_UI.NUEVA_SESION });
  }
  function volverASesionAnterior(): void {
    if (estado.enCurso || turnoActivo.current !== null || estado.sesionAnterior === null) return;
    guardarSesionId(estado.sesionAnterior);
    despachar({ tipo: ACCION_UI.VOLVER_SESION_ANTERIOR });
  }
  ```

- **Opción 2:** si la persistencia es intencional, cambiar la copia de `TEXTO_NUEVA_SESION.cuerpo` para que no prometa que las confirmaciones se descartan, y agregar un test de recarga tras NUEVA_SESION.

### WR-03: El seguimiento del scroll descarta desplazamientos reales de la usuaria fuera de la ventana de 600 ms y el `ResizeObserver` la devuelve al final mientras lee

**Archivos:** `web/src/state/seguimiento.ts:14-16,23-29` y `web/src/components/linea-de-tiempo.tsx:162-165,206-210`

**Problema:** `desplazar` solo despega la vista si hubo una "intención" en los últimos `VENTANA_INTENCION_USUARIA_MS = 600` ms. La intención solo se marca con `onWheel`, `onTouchStart`, `onPointerDown` y `onKeyDown` sobre la `<section>`. Hay desplazamientos legítimos que no renuevan la intención:

- **Arrastrar la barra de scroll:** `pointerdown` ocurre una sola vez. Si en los primeros 600 ms el arrastre no supera `DISTANCIA_PEGADO_AL_FINAL` (96 px), todos los eventos de scroll siguientes se ignoran (`hayIntencionVigente` da false) y `pegado` sigue en `true`.
- **Teclado sin foco dentro de la sección:** pasa al hacer clic en el texto de un mensaje (no enfocable) y pulsar PageUp un segundo después. El foco queda en `body`, así que el `keydown` no pasa por `.zona` y no hay intención, aunque el navegador desplaza el último scroller clicado.
- **Inercia táctil:** los eventos de scroll siguen llegando más de 600 ms después de `touchstart`.

En todos esos casos el siguiente `CRECIMIENTO` del streaming ejecuta `if (seguimiento.current.pegado) bajarAlFinal(desplazable)` y arrastra a la analista al final mientras lee un turno anterior. Es justo el síntoma que el plan 03-36 buscaba cerrar. Los tests de `tests/web/seguimiento.test.ts` solo cubren el reductor con señales sintéticas y no estos orígenes.

**Arreglo:** distinguir el scroll programático del de la usuaria por posición, no por tiempo. Hay que guardar en un ref el `scrollTop` que fijó `bajarAlFinal` y tratar como intención de la usuaria cualquier scroll que termine en otra posición. Como complemento, mantener la intención mientras el puntero esté presionado:

```ts
const scrollProgramatico = useRef<number | null>(null);
function bajarAlFinal(zona: HTMLElement): void {
  zona.scrollTop = zona.scrollHeight;
  scrollProgramatico.current = zona.scrollTop;
}
function alDesplazar(evento: SyntheticEvent<HTMLElement>): void {
  const propio = scrollProgramatico.current === evento.currentTarget.scrollTop;
  scrollProgramatico.current = null;
  if (!propio) despachar({ tipo: SENAL_SEGUIMIENTO.INTENCION, ms: evento.timeStamp });
  despachar({ tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO, ms: evento.timeStamp, distancia: distanciaAlFinal(evento.currentTarget) });
}
```

También hay que agregar un test con un scroll que llega más de 600 ms después de `pointerdown` y no viene de `bajarAlFinal`.

## Info

### IN-01: Un `proveedor_simular_envio` de un paso truncado no recibe el aviso de D-76

**Archivo:** `src/loop/services/paso-herramientas.service.ts:34-44` (y `src/loop/services/guardado-turno.service.ts:20-24`)

**Problema:** cuando el proveedor corta por `FIN_LLM.LIMITE`, `pasoTruncado` contesta las llamadas con `ARGUMENTOS_TRUNCADOS`. No las ejecuta, no las agrega a `turno.llamadas` y no genera eventos de compuerta. Un `simular_envio` truncado tampoco terminó `ENVIADO`, pero `desenlacesDeEnvio` no lo ve: no cuenta en `enviosSinCaso` ni produce `BLOQUEADO`. D-76 dice "por cada `proveedor_simular_envio` que no terminó `ENVIADO`". El riesgo es bajo porque el modelo suele reintentar, pero si el turno cierra por tope después del truncado, la prosa puede afirmar un envío sin aviso.

**Arreglo:** en `pasoTruncado`, contar como envío sin caso legible (o como `BLOQUEADO` del caso, si se puede leer) cada llamada truncada cuyo nombre sea `NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO]`.

### IN-02: "Volver a la sesión anterior" se ofrece ante cualquier 429, aunque no tenga que ver con el tope de sesiones

**Archivo:** `web/src/state/conversacion.ts:144-148`

**Problema:** `accionDelRechazo` solo mira `status === 429`. El servidor también responde 429 con el tope diario (`chat.route.ts:63-66`) y con el límite de mensajes por minuto. En esos casos el botón aparece junto a un mensaje que no habla de sesiones. Es inofensivo, porque solo rehidrata, pero confunde.

**Arreglo:** distinguir el rechazo de sesiones (por ejemplo, con un código en el cuerpo del 429) o aceptar y documentar el comportamiento.

### IN-03: El mensaje de bloqueo de acceso no usa singular ni el tiempo restante

**Archivo:** `src/config/strings.ts:361-363`

**Problema:** `esperarIntentos` arma `Espera ${minutos} minutos` sin pasar por `cantidadDeMinutos`, así que con `ACCESS_FAILED_WINDOW_MINUTES=1` dice "1 minutos". Además siempre informa la ventana completa, aunque ahora `retryAfterMs` permite decir lo que falta, como ya hace `demasiadasSesiones`.

**Arreglo:** `Espera ${cantidadDeMinutos(minutos)}`. Opcionalmente, calcular el mensaje con `retryAfterMs(clientIp)` en `access.route.ts` y en `access.middleware.ts`.

### IN-04: `cierreConPregunta` quedó como código de producción que solo usan los tests

**Archivo:** `src/domain/builders/cierre-turno.builder.ts:72-74`

**Problema:** producción ahora llama a `cierreDelTurno`. `cierreConPregunta` sigue exportada solo para `tests/unit/cierre-turno.builder.test.ts`, `tests/loop/compuerta*.test.ts` y `tests/live/agente-en-vivo.test.ts`.

**Arreglo:** que los tests llamen a `cierreDelTurno(texto, [], pendientes)` y borrar el wrapper, o dejarlo con una justificación en `docs/`.

### IN-05: `CRECIMIENTO` marca "contenido nuevo" también cuando el contenido se achica

**Archivos:** `web/src/state/seguimiento.ts:31-34` y `web/src/components/linea-de-tiempo.tsx:162-165`

**Problema:** el `ResizeObserver` despacha `CRECIMIENTO` con cualquier cambio de tamaño. Si la analista está despegada y pliega un grupo de herramientas, `crecer` enciende `contenidoNuevo` y aparece "Ir al final" sin que haya nada nuevo.

**Arreglo:** guardar la última altura observada y despachar `CRECIMIENTO` solo si `scrollHeight` aumentó.

---

_Revisado: 2026-10-15T18:21:57Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
