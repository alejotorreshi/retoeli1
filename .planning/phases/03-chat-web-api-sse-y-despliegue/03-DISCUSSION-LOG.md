# Phase 3: Chat web, API SSE y despliegue - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-14
**Phase:** 03-chat-web-api-sse-y-despliegue
**Areas discussed:** Artefactos y PII, Confirmar / Cancelar, Modo degradado, Acceso y límites

---

## Artefactos y PII

| Option | Description | Selected |
|--------|-------------|----------|
| Descarga completa + preview enmascarado | El archivo real se descarga y la vista previa muestra solo valores enmascarados (D-47) | ✓ |
| Descarga y preview completos | Ambos muestran los valores reales | |
| Solo descarga, sin preview | Sin vista previa | |

| Option | Description | Selected |
|--------|-------------|----------|
| Desde mapeo.json en una tabla | Tabla de etiqueta, valor_enmascarado y estado, igual para los tres formatos | ✓ |
| Leer el xlsx/pdf y enmascarar | Parsear el archivo y enmascarar al vuelo | |

| Option | Description | Selected |
|--------|-------------|----------|
| Entregables y soportes | formulario.*, valores-portal.md, .md del paquete, ENVIO-SIMULADO.md y soportes; fuera mapeo.json y log.jsonl | ✓ |
| Todo, incluidos mapeo.json y log.jsonl | Útil para auditar | |
| Solo formulario y paquete | Lo mínimo | |

| Option | Description | Selected |
|--------|-------------|----------|
| Mensaje claro + "vuelve a procesar" | Avisar del reinicio con un chip para reprocesar | ✓ |
| Regenerar al vuelo | Volver a generar los archivos borrados | |

**User's choice:** Las opciones recomendadas en las cuatro preguntas.

---

## Confirmar / Cancelar

| Option | Description | Selected |
|--------|-------------|----------|
| Campo estructurado + texto visible | `accion { tipo, caso }` con precedencia sobre el clasificador (D-39) | ✓ |
| Solo texto fijo | El clasificador resuelve el texto | |

| Option | Description | Selected |
|--------|-------------|----------|
| Refleja lo que decida el servidor | La tarjeta sigue los eventos del servidor y el input sigue activo | ✓ |
| Desactivar el input mientras esté abierta | Obliga a pulsar un botón | |

| Option | Description | Selected |
|--------|-------------|----------|
| Cancela solo el caso de esa tarjeta | Más preciso que el rechazo por texto | ✓ |
| Cancela todos, igual que el texto | Coherente con D-63.11 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, desde el estado de la sesión | GET /api/sessions/:id devuelve los pendientes | ✓ |
| No, solo el historial | Hay que volver a escribir "envía" | |

**User's choice:** Las opciones recomendadas en las cuatro preguntas.

---

## Modo degradado

| Option | Description | Selected |
|--------|-------------|----------|
| Aviso + selector "procesar sin IA" | Flujo determinista desde la UI | |
| Solo aviso, sin flujo | No cumple LLM-06 tal como estaba | |

**User's choice:** Preguntó qué dicen los requisitos del reto. Se revisó el PRD: no pide modo degradado, solo CA5, Robustez y `demo.ts` sin clave. LLM-06 era un requisito propio que salió de la investigación (DF-15, P3).

| Option | Description | Selected |
|--------|-------------|----------|
| Reducirlo a health + aviso | Reformular LLM-06 y diferir el flujo sin IA | ✓ |
| Mantenerlo completo como último plan | Recortable | |
| Quitarlo del todo | Eliminar LLM-06 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Config + último error observado | sin_clave, saldo_agotado o no_disponible, sin llamadas extra | ✓ |
| Solo config | Solo detecta la falta de clave | |

---

## Acceso y límites

**User's choice (primera ronda):** Pidió "lo mejor según buenas prácticas y lineamientos" para el código, y que "no se cuelen llamados que consuman nuestra API descontrolado, al igual que la IA, ya que hay costos". Se explicaron OWASP (no guardar secretos en el almacenamiento del navegador; cookie HttpOnly firmada) y los topes en capas, incluido el hueco de crear sesiones para reiniciar el tope por sesión.

| Option | Description | Selected |
|--------|-------------|----------|
| Cookie HttpOnly + Bearer para scripts | Token HMAC de 12 h, SameSite=Strict, Bearer solo para curl y pre-flight | ✓ |
| Solo header Bearer en memoria | Se pide en cada recarga | |

| Option | Description | Selected |
|--------|-------------|----------|
| Paquete propuesto | 10/min por IP, 5 fallos/15 min, 1 turno por sesión y 3 globales, 2000 caracteres y 16 KB, 5 sesiones/h por IP, 2 M tokens al día | ✓ |
| Más estricto | 5/min, 1 turno global, 1 M al día, 3 sesiones/h | |

---

## Claude's Discretion

- La forma del protocolo SSE y del fallback JSON, el indicador de progreso por etapas y la tarjeta de resultado (siempre desde los resultados de las herramientas), los chips de acción rápida y la estrategia de despliegue según el research flag.
- El diseño visual queda para `/gsd-ui-phase 3`.

## Deferred Ideas

- Flujo sin IA desde la UI (LLM-06 completo o DF-15).
- Regenerar artefactos al vuelo tras un reinicio de Render.
