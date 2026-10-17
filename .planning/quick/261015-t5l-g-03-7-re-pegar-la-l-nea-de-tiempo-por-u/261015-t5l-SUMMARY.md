---
phase: quick-261015-t5l
plan: 01
subsystem: web/seguimiento
status: complete
tags: [auto-scroll, linea-de-tiempo, scroll-anchoring, G-03-7, D-78, D-78.1]
requires: [03-47]
provides:
  - "desplazar re-pega por umbral solo si la distancia al final bajó (seAcercoAlFinal)"
  - "CRECIMIENTO lleva la distancia medida por el ResizeObserver y la guarda con la vista despegada"
affects: [web/src/components/linea-de-tiempo.tsx, 03-UI-SPEC LineaDeTiempo]
tech-stack:
  added: []
  patterns: ["el reductor guarda la última distancia al final conocida como referencia de dirección"]
key-files:
  created: []
  modified:
    - web/src/types/ui.type.ts
    - web/src/state/seguimiento.ts
    - web/src/components/linea-de-tiempo.tsx
    - tests/web/seguimiento.test.ts
    - .planning/milestones/v1-phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md
decisions:
  - "G-03-7: el umbral de 96 px re-pega solo si la distancia al final bajó respecto de la última conocida; el scroll de anclaje (distancia constante) no cambia el estado (dirección A del diagnóstico)"
  - "CRECIMIENTO refresca la referencia solo con la vista despegada; pegada, el RO llama a seguirAlFinal enseguida y la medida queda vieja"
metrics:
  duration: "4 min (reloj de ejecución, sin la lectura inicial)"
  completed: 2026-10-16
actuals:
  tokens: 5600
  tasks: 3
  commits: 4
plan_head_before: 0bd654417500fad5b878cd521323158ffd9de42c
plan_head_after: 2d5da761be453503d8c0cdd0a1b0512cd02da861
---

# Quick 261015-t5l: G-03-7, la línea de tiempo re-pega solo si la distancia al final bajó

Ahora el reductor de seguimiento guarda la última distancia al final conocida. Esa distancia se refresca en cada DESPLAZAMIENTO y, con la vista despegada, también en el CRECIMIENTO que mide el ResizeObserver. Con eso `desplazar()` vuelve a pegar la vista por el umbral de 96 px solo cuando la distancia bajó de verdad. El scroll de anclaje de Chromium sube scrollTop sin acercar la vista al final, así que ya no la vuelve a pegar. D-78 y D-78.1 siguen como estaban.

## Commits

| Task | Commit | Mensaje |
|------|--------|---------|
| 1 (rojo) | fece592 | test(03): G-03-7 reproduce el re-pegado por anclaje con la vista despegada (rojo) |
| 1 (verde) | 04e0b03 | fix(03): el seguimiento re-pega por umbral solo si la distancia al final bajó (G-03-7, D-78.1) |
| 2 | 8aa9bca | test(03): bordes de anclaje, bajada real y WR-04 con el scroll de anclaje real (G-03-7) |
| 3 | 2d5da76 | docs(03): precisar la regla de re-pegado del auto-scroll en la UI-SPEC (G-03-7) |

## Qué cambió

- `web/src/types/ui.type.ts`: `EstadoSeguimiento.distancia: number | null` y `CRECIMIENTO` con `distancia: number`, que es obligatoria.
- `web/src/state/seguimiento.ts`: `seguimientoInicial.distancia = null` y `conCambios` compara también la distancia. Hay una función nueva, `seAcercoAlFinal`. `desplazar` guarda la distancia en todas sus ramas y mantiene la precedencia fondo → subida → (se acercó y está cerca) → anotar. `crecer(estado, distancia)` guarda la distancia solo con la vista despegada. AJUSTE_PROPIO, ENVIO e IR_AL_FINAL no tocan la distancia.
- `web/src/components/linea-de-tiempo.tsx`: el ResizeObserver despacha `{ tipo: CRECIMIENTO, distancia: distanciaAlFinal(desplazable) }` antes de `seguirAlFinal`. No cambió la condición de `setVista` (un cambio que solo toca la distancia no re-renderiza) ni `overflow-anchor`.
- `03-UI-SPEC.md`: la viñeta "Auto-scroll por dirección del desplazamiento" ahora cita G-03-7, explica que re-pega solo con una bajada real que deja la vista más cerca del final y dice que el anclaje no cambia el estado.

## TDD

- **Rojo (Task 1):** `bun test tests/web/seguimiento.test.ts` dio 21 pass y **3 fail**. Fallaron la prueba G-03-7 del diagnóstico y las dos aserciones nuevas de distancia (`seguimientoInicial.distancia` y la distancia tras el crecimiento despegado). Era lo esperado.
- **Verde (Task 1):** 24 pass y 0 fail, después de ajustar la prueba de identidad (paso 8) con un estado `medido`.
- **Task 2:** 28 pass y 0 fail en el archivo; `-t "G-03-7|WR-04"` dio 6 pass.

## Comprobación de mutación contra 98a6747 (Task 2)

Con el reductor de 98a6747 puesto en su lugar de forma temporal, `bun test tests/web/seguimiento.test.ts -t "G-03-7|WR-04"` dio **1 pass y 5 fail**:

- Fallan las cuatro previstas: el diagnóstico a 375×667, los bordes con anclaje (95/96/97), la flecha abajo tras el anclaje y la WR-04 corregida.
- La de **crecimiento abajo sin anclaje** también falla, a diferencia de lo que preveía el plan. Falla solo por la aserción `crecido.distancia`, porque ese campo no existe en el reductor viejo. Su parte de comportamiento (re-pegar a 81 px) pasa con el viejo, como guarda contra una sobrecorrección.
- La **bajada real con rueda** pasa con el viejo, como estaba previsto.

Hice una mutación extra para demostrar que la prueba de crecimiento abajo detecta la falta del refresco: un `crecer` que no guarda la distancia. Con esa mutación fallan 2 pruebas (la de crecimiento abajo y "despegado, el crecimiento marca contenido nuevo"). En los dos casos restauré el reductor con `git checkout HEAD -- web/src/state/seguimiento.ts` y confirmé que `git diff --quiet` daba limpio antes de cada commit.

## Guardianes completos (Task 3)

- `bun test`: **2325 pass, 1 skip, 0 fail** (2326 pruebas en 107 archivos), con salida 0. El skip ya existía antes y no es de esta tarea.
- `bun run check`: tsc del back, tsc del front, Biome (426 archivos) y `bun audit` sin vulnerabilidades, con salida 0.
- `tests/arquitectura-web.test.ts` y `tests/sin-comentarios.test.ts`: 38 pass.
- `reto-01/` no cambió.

## Comprobación en Chromium (opcional)

Copié el arnés del diagnóstico a `scratchpad/repro-fix`, regeneré `seg.js` con `bun build --format iife` sobre el `web/src` real (el bundle contiene `seAcercoAlFinal`) y lo corrí con `node correr.mjs`, usando el playwright-core 1.64.0 de la caché de bun. Resultado con el reductor real:

| Caso | Tras subir | Crecimientos 1–3 |
|------|-----------|------------------|
| 375 (alto 251), flecha, 1 resultado | pegado=false, d=40 | pegado=false, nuevo=true, d=40 (el anclaje sube st 82 px cada vez) |
| 1280 (alto 437), flecha, 1 resultado | pegado=false | pegado=false, nuevo=true |
| 1280 (alto 437), flecha, 2 resultados (2.º caso) | pegado=false, d=40 | pegado=false, nuevo=true, d=40 (con anclaje) |
| 375, rueda -120 | pegado=false | pegado=false, nuevo=true |
| 375, PageUp | pegado=false | pegado=false, nuevo=true |

Antes del arreglo, los casos de 375 con flecha y de 1280 desde el segundo caso volvían a pegar en el primer crecimiento. En el caso con el reductor parcheado del arnés, una flecha abajo después del anclaje vuelve a pegar la vista (pegado=true, d=0).

## Deviations from Plan

**1. [Rule 1 - Bug en la prueba] Crecimiento abajo: la bajada quedaba a 40 px y no a 81 px**
- **Encontrado durante:** Task 2
- **Problema:** el primer borrador bajaba hasta una distancia de 40 px, que es menor que la referencia vieja (41). Así la prueba habría pasado sin el refresco de CRECIMIENTO y no lo demostraba.
- **Arreglo:** la bajada es `PASO_DE_FLECHA` (40 px) desde 121, así que la vista queda a 81 px. Agregué una aserción de que 81 es mayor que 41 y reutilicé `CRECIMIENTO_DEBAJO` (80) en lugar de una constante duplicada.
- **Commit:** 8aa9bca

**2. Resultado de mutación distinto del previsto:** la prueba de crecimiento abajo falla contra 98a6747 solo por la aserción de `distancia` (detalle arriba). No hubo que cambiar código.

**3. STATE.md y ROADMAP.md:** no los toqué. Es una tarea rápida fuera del ROADMAP y el orquestador registra el estado y hace el commit de la documentación.

## Límite conocido (fuera de alcance)

Si cambia el alto de la zona sin que cambie el contenido, la referencia de distancia no se refresca, porque el ResizeObserver observa `.contenido`. Pasa, por ejemplo, cuando el compositor crece o se achica con `field-sizing: content`.

- **Si la zona se agranda:** la distancia baja sin que llegue un evento de scroll, así que la referencia guardada queda mayor que la real. Si después llega un scroll de anclaje con la vista a 96 px o menos, ese caso raro puede volver a pegarla.
- **Si la zona se achica:** puede faltar un re-pegado por umbral. El fondo (1 px o menos) e "Ir al final" siguen re-pegando.

Cubrirlo pediría una señal nueva y no entraba en esta tarea.

## Verificación pendiente para la fase (human-check)

Volver a correr QA T30 / UAT test 7 con Playwright a 375×667. Con un turno en curso, una flecha arriba debe dejar la vista despegada mientras llegan eventos, debe aparecer "Ir al final" y bajar hasta el fondo debe volver a pegarla. Repetir a 1280×720 desde el segundo caso del turno.

## Known Stubs

Ninguno.

## Self-Check: PASSED

- FOUND: web/src/state/seguimiento.ts (contiene seAcercoAlFinal)
- FOUND: web/src/types/ui.type.ts (contiene `readonly distancia: number | null`)
- FOUND: web/src/components/linea-de-tiempo.tsx (contiene `CRECIMIENTO, distancia: distanciaAlFinal(desplazable)`)
- FOUND: tests/web/seguimiento.test.ts (contiene G-03-7)
- FOUND: .planning/milestones/v1-phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md (la viñeta cita G-03-7)
- FOUND commits: fece592, 04e0b03, 8aa9bca, 2d5da76
