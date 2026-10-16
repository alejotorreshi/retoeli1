---
title: Decisiones de la usuaria para la Fase 5 (front por features e identidad de marca)
created: 2026-10-16
area: web
resolves_phase: 5
source: conversación con la usuaria tras cerrar la Fase 4 (2026-10-16)
status: pending
---

## Qué

Al correr `/gsd-discuss-phase 5`, estas decisiones se toman como **ya respondidas** y pasan a `05-CONTEXT.md` como decisiones bloqueadas. No hay que volver a preguntarlas.

- **Estructura:** `web/src` se organiza en **carpetas por feature como carpeta padre**, por ejemplo chat, acceso, archivos, confirmación, casos y encabezado. Dentro de cada feature hay **una carpeta por componente**, que separa la vista (`.tsx`, solo presentación) de la lógica (hook `usar-<componente>.ts`) y de los estilos (`.module.css`). Lo compartido va en una carpeta común. La usuaria lo dijo así: "carpeta por componente más carpeta padre con feature, así lo dejamos más limpio".
- **Estado:** un **store propio sin dependencias nuevas**, con `useSyncExternalStore`, Context y selectores por slice, sobre los reductores puros de `web/src/state/`. Se descartaron Zustand, porque habría que justificar una dependencia nueva según PRD §8, y `useReducer` + Context solo.
- **Calidad:** nada hardcodeado en los componentes (textos en `strings.ts`, valores en `config/constants`, tokens en CSS). Las vistas no llevan lógica de negocio ni de red. Los guardianes W se actualizan para exigir esto. El criterio rector es "las mejores prácticas, lo mejor de la industria".
- **Alcance:** incluye la semilla de identidad de marca SEED-261014-8dq: logo o ícono, color de acento, tipografía y estado vacío con los 4 casos.
- **Modo de corrida:** **encadenada nocturna**, igual que la Fase 4: plan, ejecución, eli-qa con Playwright y loop de brechas, con un tope de 3 rondas. El orquestador sugirió detenerse para que la usuaria revise el UI-SPEC antes de planear, y la usuaria aún no lo confirmó. Preguntarle al empezar.

## Áreas grises que quedan para discutir

La usuaria todavía no respondió estas. Presentarlas en `discuss-phase`:

1. **Dirección de marca:** nombre o logo, color de acento, tipografía (fuente web autoalojada o pila del sistema) y tono visual.
2. **Estado vacío con los 4 casos:** si la tarjeta lanza el mensaje directo o llena el compositor, y si convive con los chips de acción rápida o los reemplaza.
3. **Pruebas del front:** si se agregan pruebas de componentes (Testing Library y happy-dom como devDeps) o se sigue probando sin DOM más Playwright.
4. **Mapa de features:** cómo se agrupan los componentes actuales y qué va a la carpeta común.
