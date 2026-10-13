---
status: testing
phase: 01-n-cleo-determinista
source: [01-VERIFICATION.md]
started: 2026-10-13T04:32:44Z
updated: 2026-10-13T04:32:44Z
---

## Current Test

number: 1
name: Repetir prueba 17 de UAT — anchos de columna del xlsx en Excel/LibreOffice
expected: |
  Tras `bun run demo.ts`, abrir out/co-industrias-delta/formulario.xlsx (Datos Proveedor y Datos Bancarios) y out/hn-agroexport-sula/formulario.xlsx: cada etiqueta y valor se lee completo, sin columnas recortadas; 'Actividad económica' (Datos Proveedor!C13) ajusta en varias líneas dentro de una columna de ancho 60; se conservan negritas, rellenos y notas de faltante / por confirmar.
awaiting: user response

## Tests

### 1. Repetir prueba 17 de UAT — anchos de columna del xlsx en Excel/LibreOffice
expected: Tras `bun run demo.ts`, abrir out/co-industrias-delta/formulario.xlsx (Datos Proveedor y Datos Bancarios) y out/hn-agroexport-sula/formulario.xlsx: cada etiqueta y valor se lee completo, sin columnas recortadas; 'Actividad económica' (Datos Proveedor!C13) ajusta en varias líneas dentro de una columna de ancho 60; se conservan negritas, rellenos y notas de faltante / por confirmar.
result: [pending]

### 2. Repetir prueba 20 de UAT — tono del borrador y del registro de envío (WR-01, WR-02)
expected: Leer out/<caso>/paquete/borrador-correo.md de los 4 casos y un ENVIO-SIMULADO.md confirmado. El tono es profesional para el cliente, y se decide explícitamente sobre (a) WR-01: en ec el correo promete enviar "por separado" el Número de contribuyente especial, que no existe en el maestro; (b) WR-02: el correo copia la nota interna "RUC: Identificador extranjero: confirmar si el cliente acepta el NIT colombiano".
result: [pending]

### 3. Decidir CR-01 de la revisión — "Sin bloqueos" con un soporte exigido ausente de paquete/
expected: Elegir entre corregir (archivo para el cliente ausente en paquete/ → bloqueo, o error PAQUETE_DESACTUALIZADO que pida re-armar) o aceptar con override documentado. Reproducido: (A) co sin paquete/rut-2026.txt → simular_envio confirmado escribe "Sin bloqueos." sin el RUT; (B) hn con parafiscales renovado entre armar_paquete y simular_envio → "Sin bloqueos.", parafiscales no se envía y parafiscales-2026-07.txt queda sin mencionar.
result: [pending]

### 4. Decidir WR-03 de la revisión — stdout de la demo con ids crudos de soporte
expected: Confirmar que la salida de `bun run demo.ts` y el `resumen` de las herramientas conservan ids crudos (contrato v1, D-21) y documentarlo en SOLUCION.md, o pedir un plan para mostrar nombres en la demo.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
