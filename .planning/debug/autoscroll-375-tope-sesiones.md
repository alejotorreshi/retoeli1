---
status: diagnosed
trigger: "G-03-04 y G-03-20 (UAT tests 4 y 20, QA T16): auto-scroll perdido tras >6 llamadas a 375×667, 'Ir al final' tapa texto, y tope de 5 sesiones nuevas por hora (429) durante la defensa"
created: 2026-10-15T14:10:00Z
updated: 2026-10-15T15:05:00Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug con componente de temporización (carrera determinista por orden de eventos, reproducible 6/6 a 375×667). El tope de sesiones es un Bohrbug puro (5 de 5 y luego 429 siempre).
hypothesis: CONFIRMADA. Hay tres causas raíz separadas: (1) scroll, (2) botón, (3) tope de sesiones. Ver Resolution.
test: hecho. Reproducción en Chromium headless (playwright-core 1.64 + chrome-headless-shell 1248) sobre una copia del repo en el scratchpad, con el LLM falso del QA (seeds/03-fake-llm.ts) y la instrumentación de los eventos scroll, las escrituras a scrollTop y las mutaciones del DOM.
expecting: n/a
next_action: devolver ROOT CAUSE FOUND al orquestador (modo find_root_cause_only; no se toca código).

reasoning_checkpoint:
  hypothesis: "`pegadoAlFinal` (linea-de-tiempo.tsx) se recalcula en CADA evento scroll de `.zona`, también en los que no causó la usuaria: el que genera el propio `bajarAlFinal` y el ajuste del scroll anchoring del navegador. Esos eventos se despachan de forma asíncrona, y cuando llegan, React ya insertó un bloque de más de 96 px (TarjetaResultado de ~300-330 px pocos ms después del tool_start de leer_solicitud, o al cierre la burbuja del agente encima de la tarjeta de resultado visible más la pila de confirmación debajo). `alDesplazar` mide la geometría nueva contra el scrollTop viejo, concluye que la usuaria subió y apaga el seguimiento. Nada lo vuelve a encender, ni siquiera enviar otro mensaje."
  confirming_evidence:
    - "Log A (3/6 a 375): set scrollTop=344 (t=347) → commit con TarjetaResultado (t=351, +326 px) → evento scroll (t=354) con sh=670, dist=326 → pegado=false → 'Ir al final'."
    - "Log B (3/6 a 375): commit de cierre de turno (burbuja del agente insertada en @560 encima de la tarjeta de resultado, que pasa de @560 a @946; pila de confirmación @1292) → scrollTop 788→1174 sin ninguna escritura propia (+386 = alto de la burbuja + gap) → evento scroll con dist=424 → pegado=false."
    - "Con overflow-anchor:none aplicado (CSP evitada) desaparece el tipo B (0/6) y queda el A (3/6)."
    - "Prueba de falsación: si se ocultan a React los eventos scroll de `.zona` que no vienen de una intención de la usuaria (wheel, touch o pointer dentro de la zona, o teclas de navegación), la vista queda pegada 12/12 turnos (sencillo y 4 casos, a 375×667), contra 0/12 sin el filtro."
  falsification_test: "Si el pliegue del grupo de más de 6 tarjetas fuera la causa, los turnos de 4 llamadas sin pliegue no perderían el seguimiento, y el filtro de eventos no lo arreglaría con el pliegue presente. Las dos cosas se midieron y salieron al revés."
  fix_rationale: "(solo dirección, no se aplica) Derivar el estado 'pegado' de la intención de la usuaria o de la geometría ANTES del crecimiento, no del evento scroll asíncrono. Además, volver a pegar al enviar un mensaje y neutralizar el scroll anchoring en `.zona` mientras se sigue el final."
  blind_spots: "Solo se midió en Chromium (headless shell 1248). En Safari iOS no hay scroll anchoring (sin el tipo B), pero el tipo A aplica igual. Con el modelo real los eventos llegan más espaciados (segundos entre llamadas): el tipo A depende de que tool_start y tool_end caigan en frames distintos y el tool_end llega ms después del tool_start (la herramienta es local), así que sigue igual de probable. El tipo B es independiente del ritmo."
  candidate_causes:
    - "code: inferencia de 'pegado' desde eventos scroll no originados por la usuaria (linea-de-tiempo.tsx:148-152) — CONFIRMADA"
    - "code: orden del Turno (textos antes de resultados) + tarjetas de resultado que aparecen a mitad de turno → inserciones por encima del ancla — CONFIRMADA como disparador del tipo B"
    - "config/environment: overflow-anchor:auto por defecto de Chromium en `.zona` — CONFIRMADA como contribuyente (tipo B)"
    - "code (layout): a 375×667 la línea de tiempo mide 166 px (encabezado 147 + pestañas 40 + chips 105 + compositor 209), así que desborda desde la primera tarjeta y cada RO escribe un scrollTop real que arma la carrera — CONFIRMADA como amplificador"
    - "code: pliegue del grupo de más de 6 (grupo-herramientas.tsx) — DESCARTADA"
    - "code: spans sr-only absolutos — DESCARTADA para el scroll; es un defecto latente aparte"
  and_gate: "Sí, para el síntoma visible a 375. Hacen falta (a) un evento scroll no originado por la usuaria (escritura propia o anchoring), (b) una inserción de más de 96 px antes de su despacho y (c) la falta de re-anclaje al enviar. Por eso queda pegado en un mensaje viejo durante toda la sesión. El viewport de 166 px hace que (a) ocurra en cada paso. A 1280 (437 px) la carrera solo se arma cuando el contenido ya desborda: 0/3 turnos de un caso y 1/4 de 4 casos con historial en sesión fresca. En QA T16 la sesión ya traía unas 20 llamadas."

## Symptoms

expected: Durante la demo "Procesar los 4 casos" a 1280×720 y 375×667 la línea de tiempo sigue el turno (auto-scroll), "Ir al final" no tapa contenido, y un evaluador puede abrir sesiones nuevas durante la defensa sin chocar con un límite confuso.
actual: (QA T16, más T11/T13) el auto-scroll se pierde tras más de 6 llamadas a herramientas (conocido: deferred-items.md y 03-UI-REVIEW.md #2). A 375×667 solo se ven ~166 px de conversación; tras el turno de 4 casos queda a la vista un mensaje viejo hasta pulsar "Ir al final", y ese botón tapa el texto. Aparte, la 6.ª "Nueva sesión" en una hora devolvió 429 "Abriste demasiadas sesiones nuevas en la última hora…" (NEW_SESSIONS_PER_HOUR = 5 por defecto, por IP). Runner B (T12): la página mide 5484 px en una ventana de 720 px porque las etiquetas sr-only "Tú:"/"Agente:" están en position:absolute sin ancestro posicionado; un scrollIntoView por script desplazó toda la app 121 px hacia arriba.
errors: 429 "Abriste demasiadas sesiones nuevas en la última hora…"
reproduction: UAT tests 4 y 20 (QA T16). Evidencia T16 en .qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md; capturas 03-test16-4-casos-375.png, 03-test16-casos-375.png, 03-test16-4-casos-1280.png.
started: fase 03 (conocido desde deferred-items.md y 03-UI-REVIEW.md #2)

## Eliminated

- hypothesis: El pliegue del `GrupoHerramientas` de más de 6 tarjetas al terminar el turno (useEffect setAbierto(false), 03-19) despega la vista del final. Es la causa que sugieren deferred-items.md y 03-UI-REVIEW.md #2, y su arreglo propuesto es "guardar pegadoAlFinal antes de plegar".
  evidence: (a) A 375×667, los turnos de UN caso (4 llamadas, sin pliegue) pierden el seguimiento 6/6. (b) A 1280×720 en sesión fresca, los turnos de 4 casos (16 llamadas, con pliegue) quedan pegados 3/3. (c) Con el filtro de eventos no originados por la usuaria, los turnos de 16 llamadas con pliegue quedan pegados 6/6. El encogimiento por encima o dentro de la vista nunca despega: si estaba al fondo, el clamp o el anchoring lo deja al fondo. La correlación "más de 6" es indirecta: más de 6 llamadas son 2 o más casos, eso trae más TarjetaResultado insertadas a mitad de turno y más oportunidades de perder la carrera. Arreglar el pliegue no arreglaría el síntoma.
  timestamp: 2026-10-15T14:55:00Z

- hypothesis: Los spans `.sr-only` ("Tú:"/"Agente:") en position:absolute alteran el scroll de la línea de tiempo y causan o empeoran la pérdida del auto-scroll.
  evidence: El bloque contenedor de esos spans es `.marco` (position: relative), que está FUERA del scroller `.zona`. No suman al `scrollHeight` de `.zona`: sh = top + alto del último ítem + padding, medido. Con `.zona { position: relative }` inyectado, `document.scrollHeight` vuelve a 667 (= viewport), pero la pérdida del seguimiento sigue 4/4 (tipos A y B). No hubo llamadas a scrollIntoView y el único focus() fue el input de acceso. Es un defecto latente aparte (desborde del documento), no relacionado.
  timestamp: 2026-10-15T14:58:00Z

## Evidence

- timestamp: 2026-10-15T14:12:00Z
  checked: Fase 0, base de conocimiento (.planning/debug/knowledge-base.md)
  found: No existe el archivo; no hay MemPalace consultable desde aquí. Sin patrón conocido.
  implication: Investigación abierta, sin hipótesis previa del KB.

- timestamp: 2026-10-15T14:14:00Z
  checked: web/src/components/linea-de-tiempo.tsx (completo) y linea-de-tiempo.module.css
  found: El auto-scroll depende de un ref `pegadoAlFinal` que SOLO se recalcula en `onScroll` (`alDesplazar`, línea 148-152) con `scrollHeight - scrollTop - clientHeight <= 96` (DISTANCIA_PEGADO_AL_FINAL). Un ResizeObserver sobre `.contenido` baja al final si `pegadoAlFinal` es true y, si no, prende `hayContenidoNuevo` (botón "Ir al final"). No existe ningún umbral de 6 en este archivo.
  implication: Cualquier evento scroll que se despache cuando el contenido ya creció más de 96 px por debajo del scrollTop actual se interpreta como "la usuaria subió", aunque nadie haya desplazado. Candidato a carrera.

- timestamp: 2026-10-15T14:15:00Z
  checked: grep MAXIMO_TARJETAS_ABIERTAS; web/src/state/conversacion.ts:395; web/src/components/grupo-herramientas.tsx
  found: El "más de 6" viene de `grupoSeCierraAlTerminar(n) = n > MAXIMO_TARJETAS_ABIERTAS (6)`. `GrupoHerramientas` pliega el `<details>` del grupo con un `useEffect` (setAbierto(false)) DESPUÉS del commit en que `enCurso` pasa a false.
  implication: El umbral de 6 está en el pliegue del grupo, no en la lógica de scroll. Hay que medir si el pliegue despega la vista (resultado: no; ver Eliminated).

- timestamp: 2026-10-15T14:16:00Z
  checked: .irAlFinal en linea-de-tiempo.module.css:53-66
  found: `position: absolute; inset-block-end: var(--espacio-md); inset-inline-end: var(--espacio-md)` dentro de `.marco` (position: relative), encima de `.zona`; fondo opaco `var(--dominante)`, alto mínimo `--alto-control` (40 px). `.zona` no reserva espacio (sin padding-block-end extra ni scroll-padding).
  implication: Por construcción el botón flota sobre las últimas líneas visibles.

- timestamp: 2026-10-15T14:17:00Z
  checked: web/src/styles/global.css:122-132 (.sr-only), mensaje.tsx, mensaje.module.css
  found: `.sr-only` usa `position: absolute` sin top/left. Las burbujas no están posicionadas; el ancestro posicionado más cercano es `.marco` (position: relative), FUERA de `.zona`. `body { height: 100dvh; overflow: hidden }`.
  implication: Explica los 5484 px del documento: los spans no los recorta `.zona` y su posición estática desborda al documento, cuyo viewport (overflow:hidden propagado) sigue siendo desplazable por script. Matiz al reporte de runner B: SÍ hay un ancestro posicionado (`.marco`), pero está fuera del scroller.

- timestamp: 2026-10-15T14:20:00Z
  checked: src/http/routes/chat.route.ts:77-79,160-165; rate-limiter.service.ts; server.wiring.ts:131-138; http.constants.ts:129-131; render.yaml; web/src/hooks/usar-chat.ts:116-120; web/src/state/conversacion.ts
  found: El servidor cuenta "sesión nueva" en el PRIMER mensaje con `sessionId` null o desconocido (`opensSession`), no al pulsar "Nueva sesión". Tope por IP = 5 (SESIONES_NUEVAS_POR_HORA_POR_DEFECTO, commit 0be6703), ventana fija de 1 h que arranca en el primer hit; render.yaml no fija NEW_SESSIONS_PER_HOUR. En el cliente, `nuevaSesion()` ejecuta `olvidarSesion()` (borra el id de localStorage) y NUEVA_SESION (sesionId null) ANTES de que el servidor acepte abrir otra.
  implication: Un 429 deja a la analista sin sesión: cada envío vuelve a ser "sesión nueva" y vuelve a dar 429 hasta que vence la ventana.

- timestamp: 2026-10-15T14:35:00Z
  checked: Reproducción en navegador (scratchpad: copia del repo, build web, servidor en :3123 con NODE_ENV=development, LLM falso del QA en :4123, Chromium headless 1248). Instrumentación por init script: setter de Element.prototype.scrollTop (escrituras propias), listener scroll en captura (geometría al despacho), MutationObserver (inserciones en la línea de tiempo).
  found: 375×667, turno "Procesa el caso ec-corp-andina" (4 llamadas, sin pliegue): pierde el seguimiento 6/6. Tipo A (3/6): `set` scrollTop→344 (t=347, sh=344) → commit que agrega la TarjetaResultado `LI:ec-corp-andinaPDFEC…` (t=351) → evento scroll de esa escritura despachado en t=354 con sh=670, dist=326 > 96 → pegado=false → "Ir al final" en t=356. Tipo B (3/6): al cierre, un solo commit quita "Pensando…" e inserta la burbuja del agente (@560, 370 px) ENCIMA de la tarjeta de resultado visible (pasa de @560 a @946) y la pila de confirmación (@1292, 448 px) debajo. El scrollTop salta de 788 a 1174 (+386) sin ninguna escritura propia y el evento llega con dist=424 → pegado=false.
  implication: La pérdida no requiere más de 6 llamadas: basta un caso a 375. Son dos fuentes de eventos scroll no originados por la usuaria, leídos después de un crecimiento de más de 96 px.

- timestamp: 2026-10-15T14:40:00Z
  checked: Mismas corridas con `overflow-anchor: none` en `.zona` (contexto con bypassCSP; sin eso la CSP `style-src 'self'` bloqueaba el estilo inyectado y el valor computado seguía en `auto`).
  found: El tipo B desaparece (0/6; computado `none`). El tipo A sigue (3/6). Las 3 corridas restantes quedan pegadas (st=1598, sh=1764, dist 0).
  implication: El tipo B es el scroll anchoring de Chromium: el ancla es la TarjetaResultado visible y la burbuja del agente se inserta encima, porque el orden de Turno es textos → resultados y las tarjetas de resultado ya existen a mitad de turno.

- timestamp: 2026-10-15T14:45:00Z
  checked: 1280×720, sesiones frescas: 3× un caso, 3× dos casos (8 llamadas), 3× cuatro casos (16 llamadas); y 4× "un caso + cuatro casos" (con historial).
  found: Un caso 0/3 perdidos. En las escrituras iniciales scrollTop no cambia (0→0, sh=ch=437), así que no hay evento scroll que arme la carrera. Dos casos 1/3 (tipo A con la tarjeta del 2.º caso, +302 px). Cuatro casos fresca 0/3, con pliegue incluido. Cuatro casos con historial 1/4 (tipo A, tarjeta de co-industrias-delta, +302 px).
  implication: A 1280 la carrera solo se arma cuando el contenido ya desborda, es decir con el 2.º caso o más o con historial. Por eso parecía ligada a "más de 6 llamadas". A 375 se arma desde la primera tarjeta.

- timestamp: 2026-10-15T14:48:00Z
  checked: Turno siguiente tras perder el seguimiento (secuencias "single|four" a 375).
  found: El 2.º turno (4 casos) termina con el MISMO scrollTop del primero (178 o 1174). La vista muestra el mensaje viejo 'Procesa el caso "ec-corp-andina"…' o las primeras tarjetas del turno 1, igual que en la captura de QA 03-test16-4-casos-375.png. Enviar un mensaje no vuelve a pegar: ni `iniciarTurno`/ENVIAR ni `LineaDeTiempo` ponen `pegadoAlFinal=true`.
  implication: Una pérdida temprana arruina toda la demo siguiente. Falta volver a anclar al enviar.

- timestamp: 2026-10-15T14:52:00Z
  checked: Prueba de falsación. Un listener `scroll` en captura en window hace stopPropagation de los eventos de `.zona` salvo que haya intención de la usuaria en los 600 ms previos (wheel, touchstart o pointerdown DENTRO de la zona, o PageUp/PageDown/flechas/Home/End/espacio). React registra onScroll en el propio elemento, así que no los ve.
  found: 375×667 "single|four": 6/6 corridas pegadas en los dos turnos (12/12; final dist 0, sin "Ir al final"), con el pliegue de 16 tarjetas incluido.
  implication: Confirma la causa raíz (1). Si `pegadoAlFinal` solo cambia por desplazamiento de la usuaria, el ResizeObserver basta para seguir el turno.

- timestamp: 2026-10-15T14:55:00Z
  checked: Medición de layout a 375×667 y 1280×720 con "Ir al final" visible.
  found: 375: encabezado 147 px (3 filas), pestañas 40, `.marco`/línea de tiempo 166, franja de chips 105 (2 filas), compositor 209 → 667. "Ir al final" ocupa 89×40 px con su borde superior a 56 px del fondo de la vista: tapa el 34 % del alto visible de la conversación, sobre la columna derecha del texto, con fondo opaco. 1280: encabezado 57, línea de tiempo 437, chips 57, compositor 169. El UI-SPEC (línea 100) pedía a < 640 px un encabezado en dos líneas y chips en una fila con scroll horizontal; la línea 382 preveía "Ir al final" solo con ícono en pantallas angostas (no implementado).
  implication: La superposición viene del CSS: es un botón absoluto de tamaño completo sobre un viewport de 166 px sin espacio reservado. Además aparece de más por la causa (1).

- timestamp: 2026-10-15T15:00:00Z
  checked: Tope de sesiones en navegador (servidor con valores por defecto): entrar, mensaje en la sesión 1 y luego 5 veces "Nueva sesión" → "Empezar sesión nueva" → mensaje.
  found: Pulsar "Nueva sesión" no llama al servidor; solo borra `registro-proveedor.sesion-id` de localStorage. Los mensajes de las sesiones 1 a 5 dan 200. El de la 6.ª da 429 con "Abriste demasiadas sesiones nuevas en la última hora. Sigue en la sesión actual o vuelve a intentarlo más tarde." y el id queda null. Reintentar da 429; recargar la página da 429 (id null). No hay control para volver a la sesión anterior y el compositor sigue habilitado.
  implication: Con 5 sesiones nuevas por IP y por hora, cualquier ensayo previo, recarga con id vencido (TTL 120 min o reinicio de Render) o varios evaluadores detrás de la misma IP/NAT agotan el cupo. El cliente ya descartó la sesión vigente, así que "Sigue en la sesión actual" no es accionable y la app queda inutilizable hasta una hora.

- timestamp: 2026-10-15T15:02:00Z
  checked: docs/limites-del-demo.md y defaults de costo (agent.constants.ts:75-80, http.constants.ts:123-131).
  found: El gasto ya lo acotan el tope diario (AGENT_DAILY_TOKEN_BUDGET 2M), el presupuesto por sesión (300k), el tope de iteraciones, max_tokens, el código de acceso y el saldo prepago. Con 5 sesiones por hora por IP se permiten 1,5M tokens/h por IP, así que el tope diario de 2M es el que manda de verdad. Los contadores se borran al reiniciar el proceso.
  implication: El tope de 5 aporta poca protección extra frente a los demás topes y sí agrega un riesgo de bloqueo en la defensa.

## Resolution

root_cause: |
  (1) Scroll y anclaje a 375 y con "más de 6 llamadas": `LineaDeTiempo` (web/src/components/linea-de-tiempo.tsx:148-152) deriva `pegadoAlFinal` de TODO evento `scroll` de `.zona`, midiendo `scrollHeight - scrollTop - clientHeight` cuando se despacha el evento. Dos clases de eventos que la usuaria no causó llegan de forma asíncrona, después de que React insertó un bloque de más de DISTANCIA_PEGADO_AL_FINAL (96 px):
  (A) el evento de la propia escritura `bajarAlFinal` del ResizeObserver, cuando la TarjetaResultado (~300-330 px) se inserta ms después del tool_start de leer_solicitud;
  (B) el ajuste del scroll anchoring de Chromium (overflow-anchor: auto) al cierre del turno, porque el orden de `Turno` inserta la burbuja del agente ENCIMA de la tarjeta de resultado ya visible (las tarjetas de resultado aparecen a mitad de turno) mientras la pila de confirmación se agrega debajo.
  `alDesplazar` lo interpreta como "la usuaria subió" y apaga el seguimiento. Nada lo vuelve a encender, ni siquiera enviar un mensaje nuevo, así que el turno de 4 casos queda mostrando un mensaje viejo. A 375×667 la línea de tiempo mide solo 166 px (encabezado de 3 filas 147 + pestañas 40 + chips en 2 filas 105 + compositor 209, contra el UI-SPEC: encabezado en 2 líneas y chips en una fila). El contenido desborda desde la primera tarjeta y la carrera se arma en cada paso (6/6). A 1280 solo con el 2.º caso o con historial (~25-33 %). La relación con "más de 6 llamadas" es indirecta (más casos, más tarjetas de resultado). El pliegue del grupo NO es la causa.
  (2) "Ir al final" tapa texto: `.irAlFinal` (linea-de-tiempo.module.css:53-66) es un botón de tamaño completo (40 px de alto, 89 px de ancho, fondo opaco `--dominante`) en position:absolute sobre el borde inferior derecho del scroller, y `.zona` no reserva espacio. En el viewport de 166 px a 375 cubre el 34 % del alto visible. No se implementó la variante solo-ícono para pantallas angostas que preveía el UI-SPEC (línea 382). La causa (1) además lo muestra cuando nadie desplazó.
  (3) Tope de sesiones en la defensa: dos causas que suman. (a) Servidor: NEW_SESSIONS_PER_HOUR = 5 por IP (http.constants.ts:129, sin override en render.yaml), con ventana fija de 1 h, cuenta como "nueva" todo primer mensaje con sessionId null o desconocido (chat.route.ts:77-79,160-165). Eso incluye ensayos, recargas con id vencido o tras un reinicio de Render y a todos los que comparten IP/NAT. (b) Cliente: `nuevaSesion()` (usar-chat.ts:116-120) borra el id de localStorage y del estado ANTES de que el servidor acepte abrir otra. Ante el 429 la analista queda sin sesión, cada reintento y cada recarga repiten el 429 hasta una hora, y el texto "Sigue en la sesión actual o vuelve a intentarlo más tarde" no es accionable (la sesión actual ya se descartó, no hay botón para volver ni tiempo de espera).
  Aparte (no relacionado con el scroll): `.sr-only` en position:absolute toma `.marco` (fuera de `.zona`) como bloque contenedor y desborda el documento (5484 px en QA). Es un defecto latente aparte.
fix: (no aplicado: modo find_root_cause_only)
verification: n/a (diagnóstico). Reproducción y falsación en Chromium headless descritas en Evidence.
files_changed: []
