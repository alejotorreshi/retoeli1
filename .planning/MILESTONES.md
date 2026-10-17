# Milestones

## v1 Agente Registro como Proveedor (entregado: 2026-10-16)

**Qué se entregó:** un agente conversacional completo para la analista administrativa. Lee la solicitud del cliente, mapea cada campo contra el maestro sin inventar datos y genera el formulario en xlsx, pdf o valores para portal. Después arma el paquete para firma con checklist y borrador de correo, y solo registra el envío simulado con confirmación humana explícita. Funciona en un chat web público en Render, por CLI (`bun run demo.ts`) y como módulo reutilizable para OpenCode.

**Fases completadas:** 5 fases (1–5), 105 planes, 218 tareas

**Estadísticas:**

- Duración: 5 días (2026-10-12 → 2026-10-16), 1001 commits
- Código: unas 12,7 k líneas TypeScript en `src/`, 6,6 k en `web/src` y 37,7 k en `tests/` (2670 pruebas en 132 archivos)
- Rango de git: `852d280` → `deb2c97`; 578 archivos cambiados fuera de `.planning/` y `.qa/`

**Logros clave:**

1. **Núcleo determinista sin LLM.** Las 5 herramientas tipadas `proveedor_*` reproducen la tabla de verdad del PRD: co 17/0/0 LISTO, ec 13/1/1 BLOQUEADO, hn 9/1/1 BLOQUEADO y pa 8/0/1 LISTO. Cada valor se vuelve a leer del maestro, y lo protegen pruebas golden, de determinismo y de PII.
2. **Bucle propio y compuerta de confirmación.** El bucle está escrito a mano sobre un adaptador DeepSeek compatible con OpenAI, con timeout, reintentos y respaldo, topes de tokens e iteraciones y sesiones. Cada envío simulado lo decide el servidor, no el modelo.
3. **Chat público con SSE.** API Hono con código de acceso, límites, SSE y fallback JSON. Chat React con tarjetas de herramientas en vivo, resultado, progreso, confirmación y vista previa enmascarada. Desplegado en Render detrás de la CI, con checksPass.
4. **Módulo reutilizable y documentación.** `modulo/` es la fuente única: reexporta las herramientas, genera agent.md y SKILL.md y tiene el enlace `.opencode`. Se suman README, SOLUCION.md, el pre-flight por CLI y el registro de costo por caso.
5. **Front de nivel industria.** Refactor por features y componentes, con store propio y selectores con nombre, cero valores hardcodeados, guardianes mecánicos G1–G16 y W1–W27, e identidad de marca de Periferia IT Group.
6. **QA con evidencia.** En cada fase hubo corridas batch de eli-qa con Playwright, en local y en el link público. Entre ellas, el ensayo de la sección 11 del PRD con el modelo real y la comparación antes/después del refactor del front.

**Overrides de verificación conocidos:** 18 reconocidos en este cierre y 0 arrastrados de un cierre anterior (ver Deferred Items en STATE.md). Las VERIFICATION de las fases 1–4 quedaron con la huella vieja porque fases posteriores cambiaron archivos que cubrían. Su veredicto es passed, y la auditoría v1 volvió a correr la suite completa y el chequeo de integración sobre el código actual.

**Auditoría:** `.planning/milestones/v1-MILESTONE-AUDIT.md` (tech_debt: 79/79 requisitos y 12 ítems de deuda no bloqueantes).

---
