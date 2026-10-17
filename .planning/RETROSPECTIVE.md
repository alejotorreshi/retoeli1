# Retrospectiva del proyecto

*Documento vivo que se actualiza después de cada milestone. Sus lecciones alimentan la planificación siguiente.*

## Milestone: v1 Agente Registro como Proveedor

**Entregado:** 2026-10-16
**Fases:** 5 | **Planes:** 105 | **Tareas:** 218 | **Commits:** 1001

### Qué se construyó

- Un núcleo determinista: las 5 herramientas `proveedor_*`, xlsx, pdf y portal, el paquete para firma y `demo.ts` sin LLM. Reproduce la tabla de verdad del PRD y lo cubren pruebas golden y de PII.
- Un bucle de agente propio sobre un adaptador compatible con OpenAI (DeepSeek), con resiliencia, topes de costo y una compuerta de confirmación que decide el servidor.
- Una API Hono con SSE y código de acceso, y un chat React con tarjetas de herramientas en vivo, desplegados en Render detrás de la CI.
- El bonus `modulo/` como fuente única, con README, SOLUCION.md y un pre-flight para la defensa.
- Un front refactorizado por features con store propio, guardianes W1–W27 e identidad de marca.

### Qué funcionó

- **El núcleo primero, sin LLM.** Con la tabla de verdad fija en la Fase 1, todas las capas siguientes se pudieron probar contra algo estable y sin gastar tokens.
- **El LLM falso para la QA.** Los recorridos completos en el navegador (local y comparación antes/después) costaron 0 tokens. El modelo real se reservó para unos pocos turnos autorizados en el link público.
- **La comparación antes/después con el mismo script de Playwright.** Encontró la única regresión del refactor del front, el estado vacío que abría al fondo, que ninguna prueba DOM podía ver porque happy-dom no calcula layout.
- **Guardianes mecánicos con prueba negativa.** Convirtieron las reglas de limpieza en fallas de `bun test` en vez de comentarios de revisión.
- **El diagnóstico antes del plan de corrección.** Las sesiones de gsd-debugger dieron causas con número de línea y con mediciones en px, y los planes de cierre salieron cortos y correctos a la primera.

### Qué fue ineficiente

- **Ciclos largos de cierre de brechas en casos adversariales.** Pasó con el clasificador de confirmación (02-22 a 02-24) y con el limitador de acceso de la Fase 3, que terminó en 47 planes. Cada parche abría un caso más rebuscado, y se cortó con overrides aceptados.
- **Especificaciones de UI sin aritmética en todos los anchos.** La UI-SPEC de la Fase 5 calculó el encabezado angosto solo a 375 px, y a 320 px no cabía por diseño.
- **Registro atrasado.** SEG-02 quedó "Partial" en la trazabilidad dos fases después de estar resuelto, y 16 sesiones de depuración siguieron en `diagnosed` tras sus arreglos.
- **Marcas de tiempo escritas a mano en la evidencia.** Un archivo de evidencia salió con una hora futura y hubo que renombrarlo.

### Patrones establecidos

- Cada regla de forma del código tiene un guardián en `tests/` con una prueba que demuestra que detecta la violación.
- La QA se arma por suites reproducibles (`.qa/suites/*.json`) con evidencia saneada, y el veredicto siempre lo da la usuaria.
- Los textos visibles viven en un único `strings.ts` por capa, y los códigos son objetos `as const`.
- Las vistas no tienen lógica: el hook `usar-<c>.ts` entrega los manejadores listos.

### Lecciones clave

1. Cuando una corrección destapa un caso adversarial más rebuscado que el anterior, hay que decidir pronto si aceptarlo con override en vez de seguir iterando.
2. Una UI-SPEC tiene que sumar sus medidas contra el ancho útil de cada breakpoint que promete, no solo contra el más común.
3. Las pruebas DOM sin layout necesitan un respaldo en un navegador real para todo lo que dependa de alturas, anchos o scroll.
4. Al cerrar un plan de corrección hay que actualizar también la trazabilidad y el estado de la sesión de depuración, no solo el código.
5. Las marcas de tiempo de la evidencia se toman de `date -u` en el momento, nunca se escriben a mano.

### Observaciones de costo

- Modelos: Claude Opus para la orquestación y los subagentes GSD. La mezcla exacta no se midió.
- Sesiones: no medidas.
- Destacado: toda la QA local corrió con el LLM falso a 0 tokens. El costo real por caso del agente está medido en `docs/evidencia/costo-por-caso.json`.

---

## Tendencias entre milestones

### Evolución del proceso

| Milestone | Fases | Planes | Cambio clave |
|-----------|-------|--------|--------------|
| v1 | 5 | 105 | Ciclo GSD completo con eli-qa (Playwright) y diagnóstico obligatorio antes de cada cierre de brechas |

### Calidad acumulada

| Milestone | Pruebas | Guardianes | Dependencias de runtime del servidor |
|-----------|---------|------------|--------------------------------|
| v1 | 2670 | G1–G16, W1–W27, sin-comentarios | hono, zod, exceljs, pdf-lib, pino (el front empaqueta react, react-dom y eventsource-parser) |

### Lecciones principales (verificadas en varios milestones)

1. Todavía no aplica: v1 es el primer milestone.
