# Phase 4: Módulo, documentación y defensa - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-15
**Phase:** 04-módulo-documentación-y-defensa
**Areas discussed:** Pendiente, modulo/ sin servidor, SOLUCION.md: costo e IA, CI, badge y repo, Pre-flight y defensa

---

## Pendiente incorporado

| Option | Description | Selected |
|--------|-------------|----------|
| Incluirlo | Viene marcado `resolves_phase: 4`; la sección de riesgos lo necesita | ✓ |
| Dejarlo diferido | SOLUCION.md solo enlaza docs/limites-del-demo.md | |

**User's choice:** Incluirlo.

---

## modulo/ sin servidor

### Confirmación en agent.md

| Option | Description | Selected |
|--------|-------------|----------|
| Párrafo del generador | prompt.md íntegro + una sección fija "Confirmación sin servidor" | |
| Mover el protocolo a prompt.md | Duplica la pregunta en la app | |
| Cuerpo idéntico, riesgo documentado | Byte a byte; SOLUCION.md documenta el límite | ✓ |

**User's choice:** Primero preguntó "Según los requisitos para cumplir con el reto, ¿qué es lo que se recomienda?". Claude corrigió su recomendación inicial (el párrafo del generador): el §9.4 evalúa "las mismas piezas que usa tu aplicación", así que conviene el cuerpo idéntico y documentar el límite. La usuaria eligió "Idéntico + documentar".

### Portabilidad

| Option | Description | Selected |
|--------|-------------|----------|
| Re-export dentro del repo | Alias @/, test de identidad de referencia | ✓ |
| Re-export + bundle opcional | Más un `bun build` a modulo/dist/ | |
| Solo bundle con bun build | Portable, pero contradice MOD-02 | |

### Generados

| Option | Description | Selected |
|--------|-------------|----------|
| Commitear + test de deriva | El evaluador los ve; la CI falla si hay deriva | ✓ |
| Generar al vuelo | Postinstall o CI | |

### OpenCode

| Option | Description | Selected |
|--------|-------------|----------|
| Config + ensayo manual | opencode.json + ensayo del §11 en OpenCode | |
| Solo tests automatizados | Sin instalar OpenCode | |
| Tú decides | | |
| Solo tests + formato (2.ª ronda) | Sin opencode.json | |
| Agregar además opencode.json (2.ª ronda) | Config que registra modulo/, sin ensayo en vivo | ✓ |

**User's choice:** Primero preguntó "¿Nos están solicitando hacer esa integración en los requisitos?". Claude respondió que no: el §9.4 pide el paquete y evalúa que sea la misma fuente. La usuaria eligió agregar `opencode.json`, sin ensayo en vivo.

---

## SOLUCION.md: costo e IA

| Question | Options | Selected |
|----------|---------|----------|
| Origen del costo por caso | Corrida medida nueva / Usage de corridas anteriores | Corrida medida nueva |
| Asistentes usados | Claude Code + GSD / Claude Code + otros | Texto libre (ver nota) |
| Extensión y tono | Conciso con enlaces / Exhaustivo en un archivo | Conciso con enlaces |
| Diagrama | Mermaid / ASCII como el PRD | Mermaid |

**Notes:** Sobre los asistentes, la usuaria escribió: "Ahí nos vamos con Claude y GSD, y mostrar lo clave de los agentes personalizados y los wrappers especializados y potentes, como eli-qa, y cómo adaptamos el flujo de trabajo hacia la calidad".

---

## CI, badge y repo

| Question | Options | Selected |
|----------|---------|----------|
| Entrega | Privado + invitar evaluadores / Público / Zip / Aún no lo sé | Privado + invitar evaluadores |
| Alcance de la CI | Todo bun run check + build web (audit aparte, no bloqueante) / Mínimo del PRD / Todo con audit bloqueante | Todo + build web, audit aparte |
| Deploy | Solo si pasa la CI (checksPass) / Dejarlo como está | Solo si pasa la CI |

---

## Pre-flight y defensa

| Question | Options | Selected |
|----------|---------|----------|
| Alcance del pre-flight | Health + SSE, §11 con flag / Siempre §11 / Solo health + SSE | Health + SSE, §11 con `--guion` |
| Calentar Render | Pre-flight 10 min antes / Cron externo | Texto libre: "como es prueba de reto no le ponemos tanto cuidado ahí, como sea lo mejor" → la opción simple |
| Código de acceso | Literal en el README / Se entrega aparte | Literal en el README |
| Ensayo del §11 | eli-qa con Playwright + tú / Solo tú, a mano | eli-qa con Playwright + la usuaria |

---

## Claude's Discretion

- La estructura del README.
- La relación entre `docs/arquitectura.md` y `docs/estructura.md`, y cómo derivar `docs/convenciones.md`.
- La selección de los trade-offs (3 o más).
- La ubicación y el nombre de los scripts (generador, costo y pre-flight), respetando los guardianes.
- La redacción del frontmatter `description`.

## Deferred Ideas

- Procesar sin el modelo (G-03-15 opción A): fase 3.1 aparte.
- El bundle portable de `modulo/`.
- El ensayo en vivo con OpenCode.
- Un cron externo para calentar Render.
- Revelar el valor real en la UI, y cambiar de proveedor o de modelo desde la UI.
