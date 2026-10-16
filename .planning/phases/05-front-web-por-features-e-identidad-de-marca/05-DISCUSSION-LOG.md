# Phase 5: Front web por features e identidad de marca - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-16
**Phase:** 05-front-web-por-features-e-identidad-de-marca
**Areas discussed:** Modo de corrida, Dirección de marca, Estado vacío con los 4 casos, Pruebas del front, Mapa de features

---

## Modo de corrida

| Option | Description | Selected |
|--------|-------------|----------|
| Parar tras UI-SPEC | Revisar la marca antes de planear | |
| Todo de corrido | Del UI-SPEC a la QA sin pausas, como en la Fase 4 | ✓ |

---

## Dirección de marca

| Pregunta | Opciones | Elegida |
|---|---|---|
| Nombre | Mantener / Nombre propio corto / Ligarlo a Perxia | Mantener "Registro como proveedor · Periferia IT Group" |
| Acento | Índigo / Verde petróleo / Azul saturado / Claude decide | Texto libre: "valida la marca corporativa de ellos… https://periferiaitgroup.com/" |
| Tipografía | Fuente autoalojada / Pila del sistema | Texto libre: "Validar la parte web, si no, una gratis cercana" |
| Logo | Isotipo SVG propio / Monograma | Texto libre: "Validamos primero marca" |

Tras extraer la marca de periferiaitgroup.com (teal `#063635`, neón `#6dfd8c`, verde `#15601d`, Outfit + Montserrat, botones píldora y el logo blanco con su isotipo de arco y puntos):

| Pregunta | Opciones | Elegida |
|---|---|---|
| Aplicación del color | Encabezado teal + acento verde / Todo claro + acento verde / Botón neón | Encabezado teal + acento verde |
| Tipografía | Outfit + Montserrat / Solo Outfit / Solo Montserrat | Outfit + Montserrat autoalojadas |
| Logo | Logo oficial / Isotipo redibujado / Isotipo propio inspirado | Logo oficial de su sitio |
| Estados vs verde de marca | Claude decide en el UI-SPEC / Éxito con el verde de la marca | Claude decide |
| Forma | Píldora en botones y chips / 8 px en todo | Píldora |

---

## Estado vacío con los 4 casos

| Pregunta | Opciones | Elegida |
|---|---|---|
| Clic en la tarjeta | Envía "Procesa el caso X" directo / Llena el compositor | Texto libre: "que nos dice los requisitos del reto" |
| Convivencia con los chips | Tarjetas arriba y chips debajo / Tarjeta "Todos" | Tarjetas arriba y chips debajo |
| Contenido | Derivado del slug / Ampliar /api/config | Derivado del slug |
| País | Código en píldora / Emoji de bandera | Código en píldora |

Repregunta tras revisar el PRD (§3 y §11):

| Option | Description | Selected |
|--------|-------------|----------|
| Pedido de la demo con el caso, enviado directo | La plantilla del §11 con el slug | ✓ |
| Pedido de la demo con el caso, al compositor | El mismo texto, para que lo envíe la analista | |
| Solo "Procesa el caso X" | El pedido corto del §3 | |

**Notas:** "Lo recomendado, sin salirnos de los requerimientos del reto, y no usemos ese símbolo raro § que vi por allá."

---

## Pruebas del front

| Pregunta | Opciones | Elegida |
|---|---|---|
| Pruebas de componentes | Sin deps nuevas (hooks puros + render estático) / Testing Library + happy-dom | Testing Library + happy-dom |
| Regresión FE-06 | Línea base de capturas / Solo la regresión actual | Texto libre: "Todo completo con eli-qa, que garantice" |
| E2E | Playwright MCP en eli-qa / Suite @playwright/test | Playwright MCP en eli-qa |
| Alcance del "§" | Web + CLI / También docs / Solo web | Web + CLI |

---

## Mapa de features

| Pregunta | Opciones | Elegida |
|---|---|---|
| Mapa | 8 features + compartido / 4 features más gruesas | 8 features + compartido |
| Reductores | Slice junto a la feature y store global / `state/` global | Slice junto a la feature y store global |
| Textos | Un único strings.ts / Uno por feature | Un único strings.ts |
| API | Transversal, solo hooks y store / Por feature | Transversal |

---

## Claude's Discretion

- El tono de los colores de estado, la escala tipográfica, el aspecto de las tarjetas y de la pantalla de acceso, la ubicación de los tipos, la organización de las pruebas, la numeración de los guardianes y los micro-movimientos.

## Deferred Ideas

- Quitar el "§" de la documentación, una suite `@playwright/test` en CI, ampliar `/api/config` y el modo oscuro.
