---
status: testing
phase: 03-chat-web-api-sse-y-despliegue
source: [03-VERIFICATION.md]
started: 2026-10-15T23:50:00Z
updated: 2026-10-15T23:50:00Z
---

## Current Test

number: 1
name: Push de main y redespliegue en Render
expected: |
  El link público sirve la UI de los tres cierres de brechas (03-28 a 03-47): el bundle contiene 'Comprobar de nuevo' y 'Volver a la sesión anterior' y ya no contiene 'bun run demo.ts'; health 200 sin claves; NEW_SESSIONS_PER_HOUR=20 en el panel de Render; curl -N con Bearer sigue recibiendo el SSE por trozos.
awaiting: user response

## Tests

### 1. Push de main y redespliegue en Render
expected: Hacer push de main (113 commits por delante de origin/main = 80c2b3d) y esperar el autoDeploy. El bundle servido contiene 'Comprobar de nuevo' y 'Volver a la sesión anterior' y ya no contiene 'bun run demo.ts'; health 200 sin claves; NEW_SESSIONS_PER_HOUR=20 en el panel; curl -N con Bearer recibe el SSE por trozos.
result: [pending]

### 2. Decidir WR-01 y WR-02 del review incremental (03-REVIEW.md)
expected: Arreglar ahora, diferir a la Fase 4 o aceptarlos y registrarlo en 03-REVIEW-DISPOSITION.md. WR-01: 10 Bearer correctos simultáneos sin fallos previos dan [400×5, 429×5] con 'Espera 15 minutos…' y el pedido siguiente entra con 204; 10 POST /api/acceso correctos simultáneos dan [204×5, 429×5]. WR-02: un envío FALLIDO seguido de un truncado del mismo caso con la autorización gastada deja los avisos FALLIDO y TRUNCADO_CONFIRMADO, y la compuerta queda pendiente con su pregunta.
result: [pending]

### 3. Receta T12 con el LLM falso: chip '¿Qué casos hay?'
expected: El panel no agrega un bloque en blanco y la consola no registra GET /api/casos//archivos (G-03-17).
result: [pending]

### 4. Receta T05: vista previa con mapeo.json borrado y con el archivo borrado
expected: Procesar ec-corp-andina, borrar out/ec-corp-andina/mapeo.json y abrir 'Ver' en el formulario → 422 'Este archivo no tiene vista previa. Puedes descargarlo para revisarlo.' sin pista de reinicio ni aviso de disco; borrar el archivo y repetir → 404 con la pista y el aviso de disco efímero (G-03-10).
result: [pending]

### 5. Recetas T09 y T10: health tras un 500 y tope diario
expected: Forzar un 500 ('QA-500') y luego mandar un mensaje correcto → el encabezado pasa de 'No disponible' a 'Disponible' al terminar el turno; con AGENT_DAILY_TOKEN_BUDGET=1, el turno que cruza el tope termina mostrando 'Tope diario' (G-03-14).
result: [pending]

### 6. Receta T10: pausa del envío y banner (G-03-15 / LLM-06)
expected: Con Playwright y el LLM falso, arrancar sin LLM_API_KEY; luego con FAKE_FORCE_STATUS=402; luego con AGENT_DAILY_TOKEN_BUDGET=1 y una tarjeta de confirmación abierta; reiniciar con clave y pulsar 'Comprobar de nuevo'. En sin_clave y tope_diario los controles de envío quedan deshabilitados, con la ayuda de pausa en el compositor (aria-describedby) y en la tarjeta; en saldo_agotado el compositor sigue habilitado; al volver a disponible todo se rehabilita sin recargar; 'Comprobar de nuevo' solo genera un GET /api/health; 'Nueva sesión', 'Detener respuesta', Ver, Descargar y Reintentar siguen disponibles en pausa.
result: [pending]

### 7. Receta T16: seguimiento de la línea de tiempo (D-78 y D-78.1)
expected: Con Playwright y el LLM falso a 375×667 y 1280×720, 'Procesa el caso ec-corp-andina' y luego el chip 'Los 4 casos'. Sin tocar nada, la distancia al final es de 96 px o menos tras cada turno y no aparece 'Ir al final'. Durante el turno, la primera pulsación de flecha arriba ya despega y aparece 'Ir al final' de 40×40, igual con la rueda, la barra y PageUp con el foco en un mensaje. Enviar otro mensaje la vuelve a pegar. document.scrollingElement.scrollHeight == innerHeight.
result: [pending]

### 8. Human-check de 03-42: sesión nueva, recarga y 'Volver a la sesión anterior' (D-73.5.2)
expected: Procesar ec-corp-andina hasta la tarjeta de confirmación, 'Nueva sesión' → 'Empezar sesión nueva' y recargar → empieza sin sesión y sin la tarjeta anterior. Con NEW_SESSIONS_PER_HOUR=1, abrir una sesión nueva hasta el 429, pulsar 'Volver a la sesión anterior' → trae su historial sin ningún POST /api/chat, y la recarga posterior vuelve a esa sesión.
result: [pending]

### 9. Render Events/Logs durante un turno SSE largo en el link público
expected: Los health checks siguen pasando y no hay reinicio mientras corre el stream.
result: [pending]

### 10. Prohibición de juicio de 03-35: tope de sesiones a 20
expected: render.yaml no declara AGENT_DAILY_TOKEN_BUDGET ni el presupuesto por sesión (siguen en 2 M y 300 k), así que subir el tope de sesiones a 20 no debilita el tope diario global ni el presupuesto por sesión. Veredicto no autoritativo del verificador: se cumple.
result: [pending]

### 11. Prohibición de 03-32 sin prueba: no consultar /api/health por intervalo
expected: obtenerSalud solo lo llama useSalud().refrescar; el único setInterval de web/src es el reintento de /api/config. Veredicto no autoritativo del verificador: se cumple.
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
pending: 11
skipped: 0
blocked: 0

## Gaps
