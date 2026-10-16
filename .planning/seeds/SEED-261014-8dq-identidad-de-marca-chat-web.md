---
id: SEED-261014-8dq
status: incorporated
incorporated_into: Phase 05 (front web por features e identidad de marca), 2026-10-16
planted: 2026-10-14
planted_during: Phase 03 (Chat web, API SSE y despliegue) — executing, after plan 03-11
trigger_when: cuando terminen los planes de UI de la fase 03 (03-27) y se pueda ver la interfaz completa
scope: Small
---

# SEED-261014-8dq: Identidad de marca para el chat web

## Why This Matters

El PRD deja el diseño libre ("Diseño libre", §6) y la rúbrica de §10 no existe, así que esto no suma puntos escritos. El valor está en la impresión durante la defensa en vivo con el link público: que el chat se vea como una plataforma con identidad propia y no como una pantalla genérica.

Qué incluye:
- Logo o ícono propio, un color de acento con más personalidad y una tipografía y jerarquía más de producto.
- Se mantiene el enfoque chat-first del PRD: la analista conversa con el agente.

Opcional, a decidir cuando se vea la UI completa:
- Un estado vacío más rico, con tarjetas de los 4 casos para empezar con un clic. Los datos salen de `/api/config` (`casos`) y debe alinearse con `AccionesRapidas` de la UI-SPEC.

Descartado: el modo oscuro. Está fuera de alcance en REQUIREMENTS.md porque no suma rúbrica.

## When to Surface

**Trigger:** cuando terminen los planes de UI de la fase 03 (03-27), antes del UAT de la fase o en una fase de pulido visual.

## Scope Estimate

**Small.** Son tokens de `web/src/styles/tokens.css`, un ícono y ajustes en `Encabezado` y en el estado vacío. Pasa por los guardianes W1–W13 y por la UI-SPEC.

## Breadcrumbs

- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md`: Design System, Color, Layout y el estado vacío de `LineaDeTiempo`.
- `web/src/styles/tokens.css`, `web/src/components/encabezado.tsx` y `web/src/components/linea-de-tiempo.tsx`.
- `.planning/REQUIREMENTS.md`: fuera de alcance "tema oscuro, pulido móvil".
- `src/http/routes/config.route.ts`: `/api/config` devuelve `casos`.

## Notes

La usuaria propuso la idea el 2026-10-14 al ver otra solución del mismo reto (https://registro-proveedor-cvqp.onrender.com/). La captura local está en `.playwright-mcp/ref-elki-1.png`, que está en gitignore. Esa solución sirve **solo como inspiración visual, no como modelo a copiar**. Su enfoque es otro: un panel de formulario con el chat en un botón flotante, mientras que el nuestro pone el chat al frente, como pide el PRD.
