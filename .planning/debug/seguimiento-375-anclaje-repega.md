---
status: diagnosed
trigger: "G-03-7 (UAT test 7, QA T30): a 375×667 una flecha arriba de 40 px con un turno en curso despega, pero con el siguiente evento la vista vuelve al fondo y 'Ir al final' nunca aparece; rueda y PageUp sí despegan; 1280×720 pasa 5/5"
created: 2026-10-16T02:00:00Z
updated: 2026-10-16T02:25:00Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug (determinista dada la geometría: 3/3 en QA, 3/3 en el arnés; depende de dónde cae el nodo ancla, no del azar)
hypothesis: CONFIRMADA (la de QA, precisada). Ver Resolution.
test: hecho (reductor puro + arnés Chromium con el reductor real).
expecting: n/a
next_action: devolver ROOT CAUSE FOUND (modo find_root_cause_only; no se toca src/, web/, tests/ ni reto-01/).

reasoning_checkpoint:
  hypothesis: "Despegada, `.zona` vuelve a overflow-anchor:auto; cuando crece contenido por encima del nodo ancla (tarjetas que se agregan al GrupoHerramientas, que está encima de la TarjetaResultado visible), Chromium sube scrollTop en lo que creció y emite un evento scroll con la MISMA distancia al final. desplazar() lo ve como 'no subió' y, como la distancia (40) es <= DISTANCIA_PEGADO_AL_FINAL (96), entra en cercaDelFinal → pegarEn y vuelve a pegar; el RO siguiente baja al final."
  confirming_evidence:
    - "Traza de QA a 375: 8108/41 (despegada) → grow sh 8400→8480 → scroll 8188/41 (+80, misma distancia) → 8228/1 con .siguiendo"
    - "Reductor real: [AJUSTE_PROPIO 8149, 8147/2, 8143/5, 8108/41, CRECIMIENTO, 8188/41] → pegado=true; con 160 o 392 px queda despegado; corte exacto entre 95 (re-pega) y 97 (no)"
    - "Arnés Chromium con el reductor real: 375 (alto 251) re-pega 3/3; 1280 con 1 resultado no hay ajuste y pasa; 1280 con 2 resultados re-pega; overflow-anchor:none siempre o re-pegar solo si la distancia bajó → queda despegada"
  falsification_test: "Si el re-pegado viniera de otra fuente (p. ej. una escritura propia de scrollTop), seguiría ocurriendo con overflow-anchor:none permanente o con un reductor que ignore subidas de scrollTop con distancia constante; en ambos casos el arnés queda despegado, y la rueda (d=120) recibe el mismo ajuste de anclaje sin re-pegar."
  fix_rationale: "(dirección, no se aplica) El umbral debe re-pegar solo ante una bajada de la usuaria. La firma del anclaje es Δposición == Δalto (distancia constante); la de la usuaria es que la distancia al final baja. Guardar la última distancia conocida (también en CRECIMIENTO, medida en el RO) y re-pegar por cercaDelFinal solo si la distancia bajó, o bien desactivar el anclaje también despegada."
  blind_spots: "Solo Chromium (headless 1248). Firefox también hace scroll anchoring; no se midió WebKit. El arnés usa alturas sintéticas (72/330/40 px), no la app real; la equivalencia se apoya en la traza de QA (+80 por tarjeta de herramienta). No se midió el caso mixto 'crecimiento abajo sin evento + la usuaria baja' en la app real (sí en el diseño del parche)."
  candidate_causes:
    - "code (reductor): desplazar() trata cualquier aumento de scrollTop con distancia <= 96 como bajada de la usuaria (seguimiento.ts:46-51) — CONFIRMADA"
    - "config/CSS: overflow-anchor vuelve a auto al despegar (.siguiendo solo pegada; linea-de-tiempo.tsx:197, module.css:16-18) — CONFIRMADA como fuente del evento"
    - "data/layout: el orden del Turno (GrupoHerramientas encima de TarjetaResultado) hace que las tarjetas nuevas se inserten ARRIBA de lo visible; a 375 la vista (251 px) cabe dentro de la tarjeta de resultado — CONFIRMADA como disparador geométrico"
    - "environment: scroll anchoring de Chromium — CONFIRMADA como mecanismo; sin él no hay evento"
    - "code (escritura propia de scrollTop estando despegada) — DESCARTADA"
    - "tests: la secuencia WR-04 emite AJUSTE_PROPIO despegada (señal imposible) y no hay prueba de anclaje despegada — CONFIRMADA como 'why not caught'"
  and_gate: "Sí. Hacen falta a la vez: (a) anclaje activo despegada, (b) crecimiento por encima del nodo ancla, (c) una subida que deja la distancia <= 96 y (d) el reductor que acepta cualquier subida de scrollTop como bajada. Quitar (a) o (d) basta para arreglarlo; (b) y (c) explican 375 vs 1280 y flecha vs rueda/PageUp."

## Symptoms

expected: Receta T16 (D-78 y D-78.1): a 375×667, cualquier subida de la usuaria (incluida una flecha de 40 px) despega la línea de tiempo mientras llegan eventos y aparece 'Ir al final'; el anclaje y el encogimiento no cambian el estado.
actual: QA T30 a 375×667 (3/3): con un turno en curso, una flecha arriba despega 40 px pero con el siguiente evento la vista vuelve al fondo y 'Ir al final' nunca aparece; rueda y PageUp sí despegan; 1280×720 pasa 5/5.
errors: ninguno
reproduction: UAT test 7 / QA T30 (.qa/suites/03.suite.json); evidencia "### T30" en .qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-16T01-14-17Z.md; capturas 03-test30-*.png
started: detectado en UAT 2026-10-16, después de 03-47 (D-78.1)

## Eliminated

- hypothesis: El re-pegado lo causa una escritura propia de scrollTop (seguirAlFinal) estando despegada.
  evidence: seguirAlFinal solo corre con pegado=true (RO, ENVIO, IR_AL_FINAL). En el arnés, con overflow-anchor:none permanente no hay ningún evento scroll tras la subida y queda despegada; el primer evento posterior a la subida en la traza de QA (8188/41) tiene Δposición = Δalto = 80, la firma del anclaje.
  timestamp: 2026-10-16T02:20:00Z

- hypothesis: 1280×720 está a salvo por diseño (más alto de vista).
  evidence: Con dos tarjetas de resultado debajo del grupo (2.º caso del turno) el arnés re-pega también a alto 437. QA pasó a 1280 porque en ese momento la parte alta de la vista tocaba la última tarjeta del grupo, que quedó como ancla por encima de la inserción.
  timestamp: 2026-10-16T02:20:00Z

## Evidence

- timestamp: 2026-10-16T02:00:00Z
  checked: Fase 0, base de conocimiento
  found: No existe .planning/debug/knowledge-base.md ni MemPalace consultable. Sesión previa relacionada sin archivar: .planning/debug/autoscroll-375-tope-sesiones.md (tipos A y B de eventos scroll no originados por la usuaria, anclaje estando PEGADA).
  implication: Hipótesis candidata: el mismo anclaje de Chromium (tipo B), ahora estando DESPEGADA.

- timestamp: 2026-10-16T02:05:00Z
  checked: web/src/state/seguimiento.ts:46-51 (desplazar), linea-de-tiempo.tsx:140-198 y linea-de-tiempo.module.css (.siguiendo)
  found: desplazar() tiene precedencia enElFondo(<=1) → subio(posicion < estado.posicion) → cercaDelFinal(<=96) → anotar. El estado solo guarda `posicion`, no la distancia ni el alto. `.siguiendo { overflow-anchor: none }` se aplica solo con vista.pegado; despegada vuelve `auto` (decisión de 03-36: "si la usuaria subió, el anchoring vuelve a estar activo para no mover lo que lee"). Despegada, la línea de tiempo no escribe scrollTop (el RO solo llama seguirAlFinal si pegado), así que el único DESPLAZAMIENTO "hacia abajo" sin la usuaria es el ajuste del anchoring.
  implication: cercaDelFinal no distingue "la usuaria bajó" de "el anchoring bajó scrollTop en lo que creció arriba del ancla". Una subida que dejó la vista a <= 96 px se re-pega con el primer ajuste de anchoring.

- timestamp: 2026-10-16T02:07:00Z
  checked: Reproducción pura del reductor (scratchpad/repro/reductor.ts) con la serie del diagnóstico de QA: AJUSTE_PROPIO 8149, DESPLAZAMIENTO 8147/2, 8143/5, 8108/41, CRECIMIENTO, DESPLAZAMIENTO 8188/41
  found: tras 8108/41 → pegado=false; CRECIMIENTO → contenidoNuevo=true; 8188/41 (anclaje: scrollTop +80, distancia igual) → pegado=true, contenidoNuevo=false. Rueda (160) y PageUp (392) con el mismo anclaje quedan despegadas con contenidoNuevo=true. Límite: subida de 95 px se re-pega; 97 px no.
  implication: El reductor re-pega exactamente cuando la subida deja la vista a <= DISTANCIA_PEGADO_AL_FINAL (96) y llega un ajuste de anchoring. Explica flecha (40) vs rueda (160) / PageUp (392).

- timestamp: 2026-10-16T02:08:00Z
  checked: tests/web/seguimiento.test.ts (describe D-78 y D-78.1)
  found: El único caso de anclaje ("tipo B") parte PEGADA (ajustePropio 788 → desplazamiento 1174/424). La secuencia WR-04 modela la flecha como [DESPLAZAMIENTO -40, CRECIMIENTO, AJUSTE_PROPIO +50]: un AJUSTE_PROPIO estando despegada, señal que el componente nunca emite (seguirAlFinal solo corre pegada). Ninguna prueba manda un DESPLAZAMIENTO de anclaje (posición mayor, misma distancia <= 96) estando DESPEGADA.
  implication: Las pruebas sintéticas pasan porque modelan una señal que no existe y omiten la que el navegador sí emite.

- timestamp: 2026-10-16T02:20:00Z
  checked: Arnés en Chromium headless 1248 (playwright-core 1.64 de la caché de bun; scratchpad/repro/arnes.html + correr.mjs). Usa el reductor REAL (bun build de web/src/state/seguimiento.ts) y replica linea-de-tiempo.tsx (ref síncrono, RO sobre .contenido con CRECIMIENTO + seguirAlFinal si pegado, onScroll → DESPLAZAMIENTO, `.siguiendo { overflow-anchor: none }` solo pegada). DOM: grupo de tarjetas de herramienta (72 px + 8) → tarjeta de resultado de 330 px → "Pensando…" 40 px. Cada 250 ms se agrega una tarjeta al GRUPO (encima del resultado), como en un turno real.
  found: |
    - alto 251 (375×667), ArrowUp real: 3/3 → tras subir pegado=false d=40; 1.er crecimiento: RO ve st 679→761 (anclaje +82, d=40 igual) y el scroll siguiente (17 ms después) re-pega (p=1, nuevo=false); luego seguirAlFinal la lleva a d=0. "Ir al final" nunca queda visible.
    - alto 437 (1280×720) con 1 resultado: el anclaje NO ajusta (st 493 fijo, d 40→122→204→286), queda despegada con contenido nuevo. PASA.
    - alto 437 con 2 resultados debajo del grupo (2.º caso del turno): re-pega igual que a 375 (st 843→925 d=40 → p=1). 1280 no es inmune.
    - rueda -120 a 375: el anclaje ajusta igual (st 599→681→763→845) pero d=120 > 96 → sigue despegada con contenido nuevo. PageUp (d=219) igual.
    - overflow-anchor:none siempre a 375: sin ajuste, sin evento scroll, queda despegada (d 40→122…).
    - reductor parcheado (re-pegar por umbral solo si la distancia BAJÓ respecto de la última conocida, refrescada en CRECIMIENTO con la geometría del RO): queda despegada con anclaje activo (st sube 82 por crecimiento, d=40 constante); un ArrowDown sí re-pega.
    - Orden de frame observado: anclaje en el layout → RO del mismo frame ya ve el scrollTop ajustado → el evento scroll del ajuste llega en el frame siguiente.
  implication: Confirma la hipótesis de QA y la explica por geometría: el ajuste ocurre solo si el nodo ancla (primer nodo totalmente visible desde arriba de la vista) está DEBAJO del punto de inserción. A 375 la vista de 251 px cabe entera dentro de la tarjeta de resultado (330 px), debajo del grupo que crece; a 1280 (437 px) con un solo resultado la parte alta de la vista toca la última tarjeta del grupo, que queda como ancla por encima de la inserción.

- timestamp: 2026-10-16T02:22:00Z
  checked: git log de seguimiento.ts: 7a5089b (03-36, ventana de intención), 78686f2 (03-43, por posición: `distancia <= 96` re-pegaba ANTES de mirar la dirección) y 98a6747 (03-47, dirección antes del umbral)
  found: Con 03-43 una flecha de 40 px nunca despegaba (WR-04). 03-47 movió `subio` antes de `cercaDelFinal`, lo que arregla el evento de la subida, pero dejó el umbral aceptando cualquier aumento de posición como "bajada". 03-43 justificó el anclaje como inocuo porque "mueve la vista hacia abajo" (03-43-PLAN.md:74), y bajo D-78.1 bajar dentro del umbral significa re-pegar.
  implication: El defecto nace de la combinación 03-36 (anchoring activo despegada) + 03-43/03-47 (el reductor decide "bajó" solo por scrollTop creciente).

## Resolution

root_cause: |
  `desplazar()` (web/src/state/seguimiento.ts:46-51) decide que la usuaria "bajó" solo porque scrollTop no disminuyó, y re-pega por `cercaDelFinal` (<= 96 px) sin saber quién movió la vista. Despegada, `.zona` pierde `.siguiendo` y vuelve a overflow-anchor:auto (linea-de-tiempo.tsx:197, linea-de-tiempo.module.css:16-18). Durante un turno las tarjetas de herramienta se agregan al GrupoHerramientas, que está ENCIMA de la TarjetaResultado ya visible (orden de Turno, linea-de-tiempo.tsx:43-62). Si el nodo ancla de Chromium queda debajo de esa inserción, el navegador sube scrollTop exactamente lo que creció (+80 por tarjeta) y emite un scroll con la MISMA distancia al final. Si la subida de la usuaria dejó la vista a 96 px o menos (una flecha: 40 px), ese evento cae en `cercaDelFinal` → `pegarEn` → pegado=true y contenidoNuevo=false. El ResizeObserver siguiente la baja al fondo y "Ir al final" no llega a pintarse. Hacen falta las cuatro condiciones a la vez (AND): anclaje activo despegada, crecimiento por encima del ancla, subida <= 96 px y un reductor que no distingue anclaje de bajada.
  375 vs 1280: a 375 la vista mide ~251 px y cabe entera dentro de la tarjeta de resultado (~330 px), así que el ancla queda debajo del grupo que crece. A 1280 (~437 px), con un solo resultado, la parte alta de la vista toca la última tarjeta del grupo, que queda como ancla por encima de la inserción, y no hay ajuste. Desde el 2.º caso del turno (dos resultados debajo del grupo) 1280 falla igual.
  Flecha vs rueda/PageUp: el anclaje ajusta en los tres casos. La rueda (120-160 px) y PageUp (219-392 px) dejan la distancia por encima de 96, y como el anclaje no cambia la distancia, `cercaDelFinal` nunca se cumple. La flecha deja 40 px.
  Why not caught: las pruebas de reductor modelan el anclaje solo PEGADA ("tipo B"), y la secuencia WR-04 intercala un AJUSTE_PROPIO despegada, una señal que el componente nunca emite. La señal real (DESPLAZAMIENTO con posición mayor y la misma distancia <= 96 estando despegada) no tiene prueba. El backstop de navegador de 03-47 (D7) quedó como human_judgment.
fix: (no aplica: find_root_cause_only)
verification: Diagnóstico verificado con el reductor real en bun (scratchpad/repro/reductor.ts) y en Chromium headless (scratchpad/repro/arnes.html + correr.mjs): 375 re-pega 3/3; 1280 con 1 resultado pasa; 1280 con 2 resultados re-pega; rueda y PageUp quedan despegadas; overflow-anchor:none permanente y "re-pegar solo si la distancia bajó" quedan despegadas, y un ArrowDown sí re-pega.
files_changed: []
