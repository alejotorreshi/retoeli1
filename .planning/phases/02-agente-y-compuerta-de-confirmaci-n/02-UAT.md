---
status: testing
phase: 02-agente-y-compuerta-de-confirmaci-n
source: [02-VERIFICATION.md]
started: 2026-10-14T03:45:00Z
updated: 2026-10-14T03:45:00Z
---

## Current Test

number: 1
name: Lectura humana de las cinco respuestas de la corrida en vivo de 02-21
expected: |
  A2 es breve y su única pregunta o pedido de confirmación es el del servidor (último párrafo).
  A3 y B2 informan solo el envío simulado registrado. B1 tiene caso, out/ec-corp-andina/, 13/1/1,
  RUC por confirmar con su nota, Certificado de cumplimiento tributario y BLOQUEADO. Ningún valor
  sin máscara ni ninguna afirmación de lleno, enviado o firmado sin un resultado ok (CA2).
  Se dio el "correr" y se gastó una sola corrida.
awaiting: user response

## Tests

### 1. Lectura humana de las cinco respuestas de la corrida en vivo de 02-21
expected: Lee A1, A2 "ok", A3 "sí", B1 §11 y B2 "envía" en 02-21-SUMMARY.md (VIVO PASS modelo=deepseek-flash llamadas=15 tokens=113249). A2 es breve y su única pregunta o pedido de confirmación es el del servidor; A3 y B2 informan solo el envío simulado; B1 cumple el guion §11 con BLOQUEADO; nada sin máscara ni afirmado sin un ok. Nota del ejecutor: en A2 el modelo escribió su propio pedido de confirmación sin "¿" ("dime de forma explícita algo como 'sí, envía co-industrias-delta'"); decidir si se acepta como varianza del modelo (T-02-41 / AR-02-01) o si se ajusta el prompt con una segunda corrida autorizada.
result: [pending]

### 2. Decisión sobre WR-16 (y WR-15): clase amplia de negaciones con un caso pendiente
expected: Con un caso pendiente, un pedido ajeno que contiene una palabra de NEGACIONES ("para", "no", "luego", "mejor", "después", "aún", "momento", "nada", "ni") se clasifica como "rechaza" y cancela el caso; y "No envíes nada todavía, ¿qué falta?" da "otro" y deja el caso pendiente con la pregunta del servidor. Elegir (a) aceptarlo como límite conocido con un override justificado en 02-VERIFICATION.md (falla del lado seguro, IN-01 sigue abierto), o (b) abrir un plan de cierre que acote NEGACIONES y ponga la negación antes que la pregunta, con pruebas de bucle.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
