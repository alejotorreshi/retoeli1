# Phase 2: Agente y compuerta de confirmación - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-13
**Phase:** 02-agente-y-compuerta-de-confirmacion
**Areas discussed:** Cuándo y cómo se confirma, Forma de la respuesta, Correo del cliente e inyección, Presupuesto y resiliencia, Preguntas por un valor, Conocimiento vs reglas.json, Recarga y vida de la sesión

---

## Cuándo y cómo se confirma

| Option | Description | Selected |
|--------|-------------|----------|
| "envía" basta | Al armar un paquete queda pendiente {caso, envío}; un "envía" o "sí" en el mensaje siguiente autoriza una vez | ✓ |
| Doble paso | "envía" provoca una segunda pregunta; solo un "sí" posterior autoriza | |
| Depende del estado | Un paso si el paquete está listo; doble paso si está BLOQUEADO | |

**User's choice:** Primero preguntó qué dicen los criterios del reto. Con las citas de CA3, RN4, HU-4 y §11 eligió "envía" basta.
**Notes:** El doble paso y "depende del estado" se desviaban del guion §11, porque ec-corp-andina está BLOQUEADO.

| Option | Description | Selected |
|--------|-------------|----------|
| Conservador | Verbos o afirmaciones claras sin negación; la duda no confirma | ✓ |
| Muy estricto | Solo frases exactas | |
| Modelo decide + servidor valida | Clasificación por el LLM con lista negra de negaciones | |

**User's choice:** "Lo que recomienden los requisitos". Claude eligió el conservador: §11 exige que "envía" solo confirme y que "No envíes nada todavía" no confirme, y ENV-02 exige un clasificador determinista.

| Option | Description | Selected |
|--------|-------------|----------|
| Uno a la vez | Una autorización por caso; con varios pendientes hay que nombrar el caso | ✓ |
| Lista pendiente | "envía todos" autoriza varios | |
| Lo que sugieran los requisitos | Claude elige | |

**User's choice:** Lo que sugieran los requisitos. Se resolvió como una autorización por caso, porque ENV-02 dice "para ese caso" y RN4 habla de "una acción".

---

## Forma de la respuesta

| Option | Description | Selected |
|--------|-------------|----------|
| El modelo, con un formato fijo | El prompt fija las secciones y el modelo redacta | |
| El servidor arma la parte factual | Bloque determinista más introducción del modelo | |
| Lo que sugieran los requisitos | Claude elige según CA2, §11 y HU-4 | ✓ |

**User's choice:** Lo que sugieran los requisitos. Se resolvió con un híbrido: el modelo redacta con formato fijo (HU-4: "el agente termina con un resumen"), y el servidor calcula `needsConfirmation`, emite `{ caso, accion, bloqueos }` y agrega la pregunta determinista si falta (ENV-03).

| Option | Description | Selected |
|--------|-------------|----------|
| Conteos y listas de pendientes | Llenos solo a pedido y enmascarados | ✓ |
| Todo, campo por campo | Tabla con las 17 etiquetas | |
| Solo conteos y estado | Mínimo | |

| Option | Description | Selected |
|--------|-------------|----------|
| Texto plano con viñetas | Sin tablas markdown ni negritas | ✓ |
| Markdown ligero | Requiere un render markdown en la Fase 3 | |

---

## Correo del cliente e inyección

| Option | Description | Selected |
|--------|-------------|----------|
| No lo ve | Se mantiene el contrato v1; el test con un fixture inyectado demuestra la resistencia | ✓ |
| Lo ve, delimitado y truncado | `leer_solicitud` agrega `cuerpo` entre marcadores | |
| Solo un extracto a pedido | Una herramienta o flag extra | |

**User's choice:** No lo ve.
**Notes:** Hay que reformular SOLI-03 en REQUIREMENTS.md (D-50).

---

## Presupuesto y resiliencia

| Option | Description | Selected |
|--------|-------------|----------|
| 300k por sesión | Los 4 casos más la conversación en la defensa | ✓ |
| 150k por sesión | Uno o dos casos | |
| 1M por sesión | Prácticamente sin límite | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fallback activo | v4-pro tras agotar los reintentos; desactivable por env | ✓ |
| Configurado pero apagado | Se enciende por env | |

| Option | Description | Selected |
|--------|-------------|----------|
| Llamada final sin herramientas y respaldo determinista | Siempre hay respuesta | ✓ |
| Solo determinista | Sin llamada al modelo | |

| Option | Description | Selected |
|--------|-------------|----------|
| Con tu clave en .env local | Pocas llamadas reales antes del adaptador | ✓ |
| Sin llamadas reales | Solo documentación | |
| Aún no tengo la clave | El spike es una tarea bloqueante | |

---

## Preguntas por un valor

| Option | Description | Selected |
|--------|-------------|----------|
| Enmascarado y dónde ver el real | Ruta del maestro y archivo de salida | ✓ |
| El servidor revela el valor real en la UI | Canal aparte del modelo | |

---

## Conocimiento vs reglas.json

| Option | Description | Selected |
|--------|-------------|----------|
| Explica el proceso y no repite las tablas | Una sola fuente en reglas.json | ✓ |
| Se genera desde reglas.json | Script más test de deriva | |
| Se duplican a mano | Riesgo de deriva | |

| Option | Description | Selected |
|--------|-------------|----------|
| prompt.md = comportamiento, md = proceso | La separación que necesita modulo/ | ✓ |
| Todo en prompt.md | Rompe AGT-02 | |

---

## Recarga y vida de la sesión

| Option | Description | Selected |
|--------|-------------|----------|
| En cada turno | Igual que reglas.json; sin reiniciar | ✓ |
| Al arrancar | Requiere reiniciar | |

| Option | Description | Selected |
|--------|-------------|----------|
| 2 h de inactividad, aviso y sesión nueva | Memoria con TTL y LRU | ✓ |
| Persistir en archivo | No sobrevive al disco efímero de Render | |
| 30 min | Corta pausas largas en la defensa | |

---

## Claude's Discretion

- La forma de las decisiones de la compuerta, del clasificador, de varios casos y del resumen, derivadas de las citas del PRD a pedido de la usuaria.
- La estructura del ciclo y de los decoradores, los valores de timeouts y reintentos, `redactar()`, los logs con pino, cómo llega la fecha al modelo y los textos de los mensajes.

## Deferred Ideas

- Revelar el valor real en la UI por un canal aparte.
- Persistir sesiones en archivo.
- Exponer el cuerpo del correo al modelo.
