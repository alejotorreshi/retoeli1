---
status: diagnosed
trigger: "UAT fase 05 test 1 (gap major): el estado vacío con las tarjetas nuevas abre desplazado al fondo a 1280x720 (scrollTop 183/183) y 375x667 (scrollTop 459); '¿Qué caso procesamos?' y su explicación (y a 375 las tarjetas CO y EC) quedan fuera de la vista. El front de antes (b7446861) cabía sin scroll; a 1280x1000 cabe"
created: 2026-10-16T23:00:00Z
updated: 2026-10-16T23:40:00Z
goal: find_root_cause_only
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (determinista: 183/183 a 1280x720 y 459/459 a 375x667 en cada corrida; depende solo de que el estado vacío sea más alto que `.zona`)
hypothesis: CONFIRMADA. El seguimiento al final de la línea de tiempo arranca pegado y el ResizeObserver de `.contenido` llama a seguirAlFinal en su primera notificación, también cuando lo que hay dentro es el estado vacío. Ver Resolution.
test: hecho. Build de producción servido por la API en :3190, Chromium headless 1248 (playwright-core 1.64), con instrumentación del setter de scrollTop, de las notificaciones del ResizeObserver, de fetch, de los scroll y del foco.
expecting: n/a
next_action: devolver ROOT CAUSE FOUND al orquestador (modo find_root_cause_only; no se toca src/, web/, tests/ ni reto-01/).

reasoning_checkpoint:
  hypothesis: "Al montar la línea de tiempo, `seguimientoInicial.pegado` es true (seguimiento.ts:9) y el ResizeObserver que observa `.contenido` (usar-linea-de-tiempo.ts:69-73) recibe su notificación inicial; como está pegado, llama a seguirAlFinal, que fija `scrollTop = scrollHeight` (usar-linea-de-tiempo.ts:59). Nada distingue el estado vacío (turnos.length === 0) de una conversación, así que el estado vacío, más alto que `.zona` desde la fase 5 (grilla de 4 TarjetaCaso, rótulos de sección, margen 2xl), queda desplazado al fondo."
  confirming_evidence:
    - "Traza a 1280x720: RO alto=630, zsh=678, zch=495, zst=0 → set-scrollTop 678 (antes 0, después 183) → scroll st=183. Medida final 183/183, título fuera de la vista."
    - "Traza a 375x667: RO alto=741, zsh=789, zch=330 → set-scrollTop 789 (después 459). Medida final 459/459."
    - "A 1280x1000: zsh=775=zch, la misma escritura se recorta a 0 y el título se ve, igual que en el UAT."
    - "Falsación: bloqueando SOLO la escritura de scrollTop sobre `.zona`, scrollTop queda en 0 y el título se ve a 1280x720 y 375x667. No hay otra fuente de desplazamiento (ni foco, ni anclaje, ni scrollIntoView)."
    - "b7446861 tiene la misma lógica (linea-de-tiempo.tsx:149-175 y state/seguimiento.ts con pegado=true); su estado vacío solo tenía título, cuerpo y acciones y no desbordaba."
  falsification_test: "Si la causa fuera el foco del compositor, un scrollIntoView o el scroll anchoring, el bloqueo de la escritura propia de scrollTop no dejaría la vista en 0. Quedó en 0 en las dos medidas."
  fix_rationale: "(solo dirección, no se aplica) El seguimiento al final solo tiene sentido con turnos en la línea de tiempo. Con el estado vacío (y al volver a él), la zona debe quedar arriba y el seguimiento en su estado inicial; seguirAlFinal/RO no deben actuar mientras turnos.length === 0."
  blind_spots: "Solo Chromium headless 1248; WebKit y Firefox no se midieron, pero el mecanismo es una escritura explícita de scrollTop, independiente del motor. No se midió el camino WR-03 (config fallida y reintento) en navegador; por el código, la grilla que aparece después hace crecer `.contenido` y el RO vuelve a bajar al fondo si sigue pegado."
  candidate_causes:
    - "code: seguimiento al final activo con el estado vacío; pegado=true inicial + seguirAlFinal en la notificación inicial y en cada cambio de tamaño del RO (usar-linea-de-tiempo.ts:65-75, seguimiento.ts:9) — CONFIRMADA"
    - "code/layout (fase 5): el estado vacío pasó a ser más alto que `.zona` (grilla de TarjetaCaso, rótulos de sección, margin-block-start 2xl; 630 px de contenido contra 495 px de zona a 1280x720 y 741 contra 330 a 375x667) — CONFIRMADA como disparador que destapa el defecto latente"
    - "environment: alto de la ventana; a 1280x1000 cabe y la escritura se recorta a 0 — CONFIRMADA como condición"
    - "code: foco (enfocarCampoDelMensaje / compositor) que desplaza la zona — DESCARTADA"
    - "data/timing: llegada tardía de /api/config que hace crecer la grilla después de montar — DESCARTADA como causa del síntoma del UAT (la vista del chat monta después de que /api/config responde y la primera notificación ya trae las 4 tarjetas); queda como segunda vía del mismo mecanismo solo en el reintento WR-03"
  and_gate: "Sí. Hacen falta a la vez (a) el seguimiento al final que actúa sin turnos y (b) un estado vacío más alto que `.zona`. (a) existe desde la fase 3 y por sí solo no se ve; (b) llegó con 05-09. Quitar (a) arregla todos los anchos; quitar (b) solo lo esconde en ventanas altas."

## Symptoms

expected: Al entrar con el código, el estado vacío del chat (título "¿Qué caso procesamos?", explicación, región "Casos disponibles" con 4 tarjetas, "Acciones rápidas") se ve desde arriba, scrollTop 0.
actual: A 1280x720 scrollTop 183/183 y a 375x667 scrollTop 459; el título y la explicación (y a 375 las tarjetas CO y EC) quedan fuera de la vista. En b7446861 cabía sin scroll; a 1280x1000 cabe.
errors: ninguno (sin errores de consola).
reproduction: UAT test 1 (.planning/milestones/v1-phases/05-front-web-por-features-e-identidad-de-marca/05-UAT.md), build de producción servido por la API, Playwright a 1280x720 y 375x667, contexto fresco, tras aceptar el código.
started: fase 5 (planes 05-07 disposicion y 05-09 TarjetaCaso/estado vacío). No presente en b7446861.

## Eliminated

- hypothesis: Un focus() sobre un elemento cercano al fondo (el compositor) o un scrollIntoView desplaza `.zona` al entrar.
  evidence: No hay scrollIntoView ni scrollTo en web/src. Los únicos focusin registrados al entrar son INPUT y BUTTON de la pantalla de acceso, fuera de `.zona`. El compositor está fuera del scroller (columnas.tsx:30-34). Con la escritura de scrollTop sobre `.zona` bloqueada, la vista queda en 0.
  timestamp: 2026-10-16T23:20:00Z

- hypothesis: La respuesta de /api/config llega después de montar el estado vacío, la grilla crece y ese crecimiento dispara la bajada (hipótesis del QA).
  evidence: Con /api/config retrasado 1500 ms, la primera notificación del RO (t=3423) llega 16 ms después de la respuesta de config (t=3407) y ya trae las 4 tarjetas; la vista del chat no monta antes. La bajada viene de la notificación INICIAL del RO, no de un crecimiento posterior. El crecimiento sí sería una segunda vía en el reintento WR-03, por el mismo mecanismo.
  timestamp: 2026-10-16T23:25:00Z

## Evidence

- timestamp: 2026-10-16T23:00:00Z
  checked: Fase 0, base de conocimiento
  found: No existe .planning/debug/knowledge-base.md ni MemPalace consultable. Sesiones previas relacionadas sin archivar: autoscroll-375-tope-sesiones.md y seguimiento-375-anclaje-repega.md (seguimiento al final de `.zona`, ResizeObserver, scroll anchoring de Chromium, reductor seguimiento.ts).
  implication: Hipótesis candidata: el seguimiento al final (pegado=true) aplica también al estado vacío.

- timestamp: 2026-10-16T23:05:00Z
  checked: web/src/features/chat/linea-de-tiempo/linea-de-tiempo.tsx, usar-linea-de-tiempo.ts, estado/seguimiento.ts
  found: `seguimientoInicial.pegado = true` (seguimiento.ts:9). El ResizeObserver (usar-linea-de-tiempo.ts:69-73) observa `.contenido`, que envuelve AvisoInicial + CuerpoLinea (EstadoVacio incluido) + IndicadorPensando (linea-de-tiempo.tsx:100-106). En cada callback, si `pegado`, llama `seguirAlFinal` → `scrollTop = scrollHeight` (usar-linea-de-tiempo.ts:59,71). La señal CRECIMIENTO no cambia `pegado` cuando ya está pegado (seguimiento.ts:65). No hay condición que excluya el estado vacío (turnos.length === 0) ni la hidratación.
  implication: Toda vez que `.contenido` cambia de tamaño (incluida la primera observación, que ResizeObserver siempre notifica) con el estado vacío desbordando `.zona`, la vista baja al fondo. Mecanismo plausible; falta confirmar en navegador.

- timestamp: 2026-10-16T23:07:00Z
  checked: git show b7446861 (front de antes): web/src/components/linea-de-tiempo.tsx líneas 149-175 y web/src/state/seguimiento.ts
  found: Misma lógica: ResizeObserver + `if (seguimiento.current.pegado) seguirAlFinal(desplazable)` y `seguimientoInicial.pegado = true`. El EstadoVacio de entonces solo tenía título, cuerpo y acciones (sin grilla de casos).
  implication: El defecto es latente desde la fase 3; antes no se veía porque el contenido vacío no desbordaba `.zona` y `scrollTop = scrollHeight` se recortaba a 0. La fase 5 lo destapa al hacer el estado vacío más alto que la zona.

- timestamp: 2026-10-16T23:07:00Z
  checked: grep de scrollIntoView/focus()/autoFocus/scrollTop/scrollTo en web/src
  found: Ninguna llamada a scrollIntoView ni scrollTo. Las únicas escrituras de scrollTop son de seguirAlFinal. Los focus() están en acceso, pestañas, diálogos, bloque-caso y `enfocarCampoDelMensaje` (compositor, que está fuera de `.zona`). El useLayoutEffect de usar-estado-vacio.ts solo enfoca el campo al DESMONTAR el estado vacío.
  implication: El foco no puede desplazar `.zona` al entrar (el compositor no está dentro del scroller); la única fuente de scroll programático es seguirAlFinal.

- timestamp: 2026-10-16T23:15:00Z
  checked: Reproducción en Chromium headless 1248 con el build de producción (bun run build:web; servidor NODE_ENV=production en :3190), contexto fresco, código aceptado; instrumentación del setter de scrollTop, del ResizeObserver, de fetch, de scroll y de focusin (scratchpad/pw/vacio.ts).
  found: 1280x720 → RO alto=630 zsh=678 zch=495 zst=0; set-scrollTop 678 (0→183); scroll st=183; final 183/183, título fuera. 375x667 → RO alto=741 zsh=789 zch=330; set-scrollTop 789 (0→459); final 459/459. 1280x1000 → zsh=775=zch, la escritura se recorta a 0, título visible. Una sola escritura de scrollTop por carga, siempre desde el primer callback del RO.
  implication: Reproduce exactamente las cifras del UAT (183/183 y 459). La bajada ocurre en la primera notificación del RO al montar.

- timestamp: 2026-10-16T23:18:00Z
  checked: Falsación: mismo arnés con la escritura de scrollTop sobre `.zona` convertida en no-op (modo sin-escritura).
  found: 1280x720 y 375x667 quedan en scrollTop 0 con el título visible; no aparece ningún otro evento scroll.
  implication: seguirAlFinal es la única causa del desplazamiento; descarta foco, scroll anchoring y scrollIntoView.

- timestamp: 2026-10-16T23:30:00Z
  checked: Otras vías hacia el estado vacío, con el LLM falso de QA (scratchpad/fake-llm.ts en :4190) y el servidor apuntado a él (scratchpad/pw/vacio2.ts y vacio3.ts).
  found: (1) /api/config tardío: mismo resultado (183 y 459), la vista monta después de config. (2) Turno de ec-corp-andina pegado al final + "Nueva sesión" → estado vacío de nuevo en 183/183 y 459/459 (LineaDeTiempo no se vuelve a montar entre sesiones y el seguimiento sigue pegado). (3) Mismo turno pero despegada con la rueda + "Nueva sesión" → scrollTop 0, pero aparece el botón "Ir al final" sobre el estado vacío (la notificación del RO con la vista despegada marca contenidoNuevo=true, seguimiento.ts:64-67). (4) Recargar la página con una sesión sin turnos → 183/183 y 459/459.
  implication: El mismo mecanismo afecta la entrada, Nueva sesión, la recarga y (por código) el reintento WR-03. Además, el estado del seguimiento sobrevive al cambio de sesión, lo que deja "Ir al final" en un estado vacío.

- timestamp: 2026-10-16T23:35:00Z
  checked: git log de estado-vacio.tsx y de ResizeObserver en web/src; pruebas tests/web/seguimiento.test.ts y tests/web/dom/*
  found: El RO con seguirAlFinal viene de 03-07 (a863ac3). La grilla de casos y las secciones del estado vacío llegan en 05-09 (b12df3c, f340c43). Las pruebas del reductor cubren turnos (subidas, anclaje, crecimiento) pero ninguna cubre el estado vacío, y el arnés happy-dom no tiene layout (scrollHeight y clientHeight valen 0), así que la escritura se recorta siempre a 0.
  implication: Por qué no se detectó: ninguna compuerta mide la posición del scroll del estado vacío con un layout real; el defecto de la fase 3 quedó latente hasta que 05-09 hizo el estado vacío más alto que la zona.

## Resolution

root_cause: "web/src/features/chat/linea-de-tiempo/usar-linea-de-tiempo.ts:69-71: el ResizeObserver de `.contenido` llama a seguirAlFinal (línea 59, scrollTop = scrollHeight) en su notificación inicial y en cada cambio de tamaño mientras `seguimiento.current.pegado` sea true, y `seguimientoInicial.pegado` arranca en true (web/src/features/chat/estado/seguimiento.ts:9). No hay excepción para el estado vacío (CuerpoLinea renderiza EstadoVacio dentro de `.contenido` cuando turnos.length === 0, linea-de-tiempo.tsx:67 y 100-102), así que al montar la vista baja al fondo; es un defecto latente desde 03-07 que 05-09 destapa al hacer el estado vacío (grilla de TarjetaCaso + rótulos) más alto que `.zona` (630 contra 495 px a 1280x720; 741 contra 330 px a 375x667). Contribuyente: el estado del seguimiento no se reinicia al volver al estado vacío (Nueva sesión), lo que además deja 'Ir al final' visible si estaba despegada."
fix: (no aplica, find_root_cause_only)
verification: (no aplica)
files_changed: []
