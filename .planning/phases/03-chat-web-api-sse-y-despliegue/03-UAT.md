---
status: testing
phase: 03-chat-web-api-sse-y-despliegue
source: [03-VERIFICATION.md]
started: 2026-10-15T06:12:32Z
updated: 2026-10-15T06:12:32Z
---

## Current Test

number: 1
name: Publicar la UI de la fase en el link público y recorrerla con el modelo real
expected: |
  Tras el push de main y el autoDeploy de Render, el bundle de https://registro-proveedor-bfnt.onrender.com contiene la UI de 03-13 a 03-27; con el código de acceso: fecha 2026-09-03, chip "Demo §11", tarjetas de herramienta en vivo, tarjeta de resultado (13/1/1, No listo para firma), progreso por etapas, tarjeta de confirmación con Confirmar/Cancelar, recarga, descarga y vista previa enmascarada; el SSE llega por trozos con curl -N y "¿Qué casos hay?" no termina en error con el modelo real.
awaiting: user response

## Tests

### 1. Publicar la UI de la fase en el link público y recorrerla con el modelo real
expected: El bundle publicado trae la UI completa de la fase; cada paso se ve como en las capturas locales (.playwright-mcp/03-*.png); el SSE sigue llegando por trozos; "¿Qué casos hay?" no termina en tarjeta de error.
result: [pending]

### 2. Health checks de Render durante un turno SSE largo
expected: En Render → Events/Logs los health checks siguen pasando y no hay reinicio mientras corre el stream.
result: [pending]

### 3. Misma sesión en dos pestañas
expected: La segunda pestaña muestra el aviso de sesión ocupada y sigue usable; tras recargar, ambas muestran el mismo historial.
result: [pending]

### 4. Demo "Procesar los 4 casos" a 1280×720 y 375×667
expected: Línea de tiempo, panel y diálogo con scroll propio; encabezado y compositor fijos; argumentos largos y vistas .md con alto máximo y scroll, sin desbordar; observar el auto-scroll tras más de 6 llamadas.
result: [pending]

### 5. El envío simulado no se presenta como un correo real
expected: La tarjeta y el resultado dicen "Envío simulado" y "Confirmar registra solo ENVIO-SIMULADO.md. No se envía ningún correo real."; nada sugiere un correo real.
result: [pending]

### 6. bun run dev desde un clon limpio en menos de 2 minutos
expected: Health por el proxy de Vite en menos de 120 s.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
