---
status: testing
phase: 02-agente-y-compuerta-de-confirmaci-n
source: [02-VERIFICATION.md]
started: 2026-10-13T22:36:32Z
updated: 2026-10-13T22:36:32Z
---

## Current Test

number: 1
name: Revisión CA2 de las respuestas en vivo
expected: |
  co-industrias-delta: texto plano construido solo con resultados de herramientas; el último párrafo es la pregunta LISTO del servidor.
  §11 turno 1: caso y out/ec-corp-andina/, 13 llenos, 1 faltante, 1 por confirmar, 'Número de contribuyente especial', RUC por confirmar con su nota, 'Certificado de cumplimiento tributario' y BLOQUEADO; sin segunda pregunta del modelo; último párrafo = pregunta del servidor con el bloqueo legible.
  Turno 2: envío simulado solo de ec-corp-andina, sin correo real ni firma.
  Ningún valor sin máscara; ninguna afirmación de lleno, enviado o firmado sin un resultado ok de herramienta; el modelo nunca dice que registró un envío si no llamó a proveedor_simular_envio (riesgo WR-04).
awaiting: user response

## Tests

### 1. Revisión CA2 de las respuestas en vivo (bun run test:vivo, corrida de 02-13 o una nueva con la clave en .env)
expected: Las tres respuestas cumplen lo descrito arriba; ninguna afirma lleno/enviado/firmado sin resultado ok de herramienta.
result: [pending]

### 2. Decisión de producto sobre WR-01: ¿un acuse suelto ('ok', 'listo', 'vale', 'claro', 'correcto') o 'si todo bien' cuenta como confirmación explícita?
expected: (a) aceptar tal como está (tabla D-39 de 02-14) y documentar el riesgo en SOLUCION.md, o (b) endurecer la gramática para exigir afirmación fuerte o verbo de envío (mover 'ok', 'vale', 'listo', 'claro, ok' a OTRO en tests/unit/confirmacion.policy.test.ts).
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
