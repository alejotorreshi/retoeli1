---
phase: 03-chat-web-api-sse-y-despliegue
plan: 42
subsystem: web
status: complete
tags: [sesion, localstorage, d-73.5.2, wr-02, g-03-04, nueva-sesion, recarga]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "sesionAnterior en memoria y VOLVER_SESION_ANTERIOR ante un 429 de sesión nueva (03-38, D-73.5.1)"
provides:
  - "sesionGuardadaTras(guardada, estado, accion): función pura que decide qué id queda en el navegador tras NUEVA_SESION o VOLVER_SESION_ANTERIOR"
  - "sincronizarSesionGuardada(accion) en useChat: nuevaSesion olvida el id guardado y volverASesionAnterior lo vuelve a guardar, siempre a través de sesion-local.ts"
  - "Describe 'D-73.5.2: Empezar sesión nueva olvida el id guardado' con filas de recarga sobre estadoAlCargar"
  - "03-UI-SPEC.md alineada con D-73.5.2 (DialogoNuevaSesion, Persistencia y recarga y la fila 413/429/503)"
affects: [verificación de la fase 03, human-check de recarga con Playwright]

actuals:
  tokens: 2959
  tasks: 2
  commits: 2
plan_head_before: 305ac91e7eebff5e94b1ad372dd9c7f44d9a38d3
plan_head_after: 8a7f57b67343dc21d1e4f64fd47210299f6ecd5d

tech-stack:
  added: []
  patterns:
    - "La decisión sobre el almacenamiento del navegador vive en una función pura de web/src/state probada como reductor; el hook solo la aplica con sesion-local.ts"
    - "Un mismo predicado (sesionAnteriorDisponible) decide el reductor VOLVER_SESION_ANTERIOR y el id guardado, así memoria y navegador no discrepan"

key-files:
  created: []
  modified:
    - web/src/state/conversacion.ts
    - web/src/hooks/usar-chat.ts
    - tests/web/conversacion.test.ts
    - .planning/milestones/v1-phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md

key-decisions:
  - "D-73.5.2 aplicado: 'Empezar sesión nueva' olvida el sessionId guardado; el anterior vive solo en memoria (sesionAnterior) para 'Volver a la sesión anterior' ante un 429, que lo vuelve a guardar"
  - "Con un turno en curso, sesionGuardadaTras devuelve el id guardado sin cambios para cualquier acción (edge UI-08 de concurrencia), además del guard que ya tenía el hook"
  - "El reductor, sus acciones, despacharDelTurno (turn_start) y recibirSesion (404) no cambian; no hay texto visible nuevo"

patterns-established:
  - "sesionAnteriorDisponible(estado) = sesionAnterior si no hay turno en curso; la usan volverASesionAnterior y sesionGuardadaTras"

requirements-completed: [UI-08, UI-04]

coverage:
  - id: D1
    description: "'Empezar sesión nueva' olvida el id guardado y recargar después empieza sin sesión ni tarjetas de confirmación"
    requirement: "UI-08"
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#NUEVA_SESION sin turno en curso olvida el id guardado"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#recargar tras el 429 empieza sin sesión y ya no ofrece volver"
        status: pass
    human_judgment: false
  - id: D2
    description: "Con un turno en curso, NUEVA_SESION y VOLVER_SESION_ANTERIOR no cambian el id guardado; las demás acciones tampoco"
    requirement: "UI-08"
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#con un turno en curso NUEVA_SESION conserva el id guardado"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#VOLVER_SESION_ANTERIOR sin sesión anterior o con turno en curso deja el guardado como estaba"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#las demás acciones dejan el guardado como estaba"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ante un 429 de sesión nueva, 'Volver a la sesión anterior' vuelve a guardar el id y una recarga posterior hidrata esa sesión"
    requirement: "UI-04"
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#VOLVER_SESION_ANTERIOR vuelve a guardar la sesión anterior"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#recargar después de volver hidrata la sesión anterior"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#VOLVER_SESION_ANTERIOR recupera el id anterior, pide su historial y conserva el borrador"
        status: pass
    human_judgment: false
  - id: D4
    description: "El hook aplica sesionGuardadaTras en el navegador real (localStorage) sin POST a /api/chat al volver"
    requirement: "UI-08"
    human_judgment: true
    rationale: "No hay pruebas que monten el hook (sin DOM en bun test); lo confirma el human-check con Playwright MCP al cierre de la fase"
  - id: D5
    description: "03-UI-SPEC.md describe D-73.5.2 y ya no promete que recargar vuelve a la sesión anterior"
    requirement: "UI-08"
    verification:
      - kind: command
        ref: "grep -c 'D-73.5.2' 03-UI-SPEC.md (4) y grep -c 'Recargar antes de mandar ese mensaje vuelve a la sesión anterior' (0)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-10-15
---

# Phase 03 Plan 42: Empezar sesión nueva olvida el id guardado (D-73.5.2) Summary

**`sesionGuardadaTras` decide en `web/src/state` qué `sessionId` queda en `localStorage`: "Empezar sesión nueva" lo olvida, "Volver a la sesión anterior" lo restaura, y el hook solo lo aplica a través de `sesion-local.ts` (WR-02 cerrado).**

## Performance

- **Duración:** ~4 min
- **Tareas:** 2 (1 trazador + 1 auto)
- **Archivos modificados:** 4

## Accomplishments

- `sesionGuardadaTras(guardada, estado, accion)` en `web/src/state/conversacion.ts`: con un turno en curso devuelve lo guardado; `NUEVA_SESION` devuelve `null`; `VOLVER_SESION_ANTERIOR` devuelve la sesión anterior disponible (o lo guardado si no hay); cualquier otra acción deja lo guardado.
- `sesionAnteriorDisponible(estado)` es el predicado común del reductor `volverASesionAnterior` y de `sesionGuardadaTras`, así memoria y navegador no discrepan.
- `useChat` agrega `sincronizarSesionGuardada(accion)`: lee `leerSesionGuardada()`, calcula el siguiente id y, solo si cambió, llama `olvidarSesion()` o `guardarSesionId(id)`. `nuevaSesion()` y `volverASesionAnterior()` conservan su guard, sincronizan y despachan; ninguna manda nada a `/api/chat`.
- Siete filas nuevas en el describe "D-73.5.2: Empezar sesión nueva olvida el id guardado", incluidas las dos de recarga con `estadoAlCargar`. Las filas de 03-38 siguen verdes sin cambios.
- `03-UI-SPEC.md`: DialogoNuevaSesion, la viñeta del 429, Persistencia y recarga y la fila 413/429/503 de UI Considerations describen D-73.5.2.

## Task Commits

1. **Tarea 1 (trazador): Empezar sesión nueva olvida el id guardado y solo Volver lo restaura** - `c402c45` (fix)
2. **Tarea 2: la UI-SPEC describe la persistencia de D-73.5.2** - `8a7f57b` (docs)

## Files Created/Modified

- `web/src/state/conversacion.ts`: `sesionAnteriorDisponible` y `sesionGuardadaTras`.
- `web/src/hooks/usar-chat.ts`: `sincronizarSesionGuardada`, que usan `nuevaSesion` y `volverASesionAnterior`.
- `tests/web/conversacion.test.ts`: describe D-73.5.2.
- `.planning/milestones/v1-phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md`: cuatro reemplazos acotados.

## Decisions Made

- La regla del turno en curso va primero en `sesionGuardadaTras`, así cubre las dos acciones aunque el reductor `NUEVA_SESION` no mire `enCurso` (el guard lo tiene el hook). El reductor no cambia, como pide el plan.

## Deviations from Plan

Ninguna: el plan se ejecutó tal como estaba escrito.

## Verificación

- RED: `bun test tests/web/conversacion.test.ts` falló antes de implementar (export `sesionGuardadaTras` inexistente).
- Puerta del trazador (end-of-phase, `<verify>` solo automático): `bun test tests/web/conversacion.test.ts` dio 57 pass; `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts` dio 38 pass. Trazador verificado de punta a punta antes de la tarea 2.
- `bun run build:web` OK, `bun run check` OK (tsc, tsc web, Biome y bun audit sin vulnerabilidades).
- `bun test` completo: 2274 pass, 1 skip (la prueba en vivo opt-in, previa a este plan), 0 fail.
- Criterios de aceptación: `export function sesionGuardadaTras` presente; `sincronizarSesionGuardada` aparece una vez en `nuevaSesion` y una en `volverASesionAnterior`; `D-73.5.2` en las pruebas (1) y en la UI-SPEC (4); la frase vieja de recarga da 0; "sesión anterior en memoria" en la línea 452.
- Pendiente para el cierre de la fase (human_verify_mode end-of-phase): el human-check de la tarea 2 con Playwright MCP y el LLM falso (procesar ec-corp-andina hasta la tarjeta, "Empezar sesión nueva", recargar → estado vacío; con `NEW_SESSIONS_PER_HOUR=1`, el 429, "Volver a la sesión anterior" sin POST a `/api/chat` y la recarga que vuelve a esa sesión).

## Issues Encountered

- Los commits van directo a `main`. `gsd-tools query git.base-branch --is-protected main` dice `true`, pero el orquestador despachó la ejecución secuencial en el árbol principal y el proyecto usa `branching_strategy: none`: todos los planes anteriores de la fase hicieron commit en `main`. Se siguió esa convención y queda anotado.

## Next Phase Readiness

- WR-02 / G-03-04 cerrado según D-73.5.2. Queda el human-check de recarga en la verificación de la fase. El edge UI-04 sin clasificar del informe de cobertura se revisa a mano en esa verificación.

## Self-Check: PASSED

- FOUND: web/src/state/conversacion.ts, web/src/hooks/usar-chat.ts, tests/web/conversacion.test.ts, 03-UI-SPEC.md
- FOUND: c402c45, 8a7f57b (ancestros de HEAD)
