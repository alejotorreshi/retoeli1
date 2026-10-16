---
status: testing
phase: 03-chat-web-api-sse-y-despliegue
source: [03-VERIFICATION.md]
started: 2026-10-15T23:50:00Z
updated: 2026-10-16T02:40:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Push de main y redespliegue en Render
expected: Hacer push de main (por delante de origin/main = 80c2b3d) y esperar el autoDeploy. El bundle servido contiene 'Comprobar de nuevo' y 'Volver a la sesión anterior' y ya no contiene 'bun run demo.ts'; health 200 sin claves; NEW_SESSIONS_PER_HOUR=20 en el panel; curl -N con Bearer recibe el SSE por trozos.
result: pass
reported: "QA T18 (11/11): el link público sirve el build de HEAD e953108 (index-CFlF9AfY.js, sha256 idéntico), con 'Comprobar de nuevo' y 'Volver a la sesión anterior' y sin 'bun run demo.ts'; health 200 sin claves; 401 sin cookie; acceso 204 con cookie HttpOnly/Secure/SameSite=Strict. render.yaml NEW_SESSIONS_PER_HOUR=20. Evidencia: .qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-16T01-14-17Z.md"

### 2. Decidir los hallazgos del limitador y del aviso de envío cortado
expected: Arreglar ahora, diferir o aceptarlos y registrarlo.
result: pass
reported: "Decisión 2026-10-16: cortar el ciclo. Se revierte 71d8d20 (5f07e7c); el cruce de ventana de D-77.2 y el aviso tras un envío confirmado que falló y se cortó (fec1e85) se aceptan con override en 03-VERIFICATION.md, y docs/limites-del-demo.md documenta el tope por IP como aproximado y la corrección de un despliegue real."

### 3. Receta T12 con el LLM falso: chip '¿Qué casos hay?'
expected: El panel no agrega un bloque en blanco y la consola no registra GET /api/casos//archivos (G-03-17).
result: pass
reported: "QA T26 (3/3): sin bloque en blanco y sin GET /api/casos//archivos."

### 4. Receta T05: vista previa con mapeo.json borrado y con el archivo borrado
expected: Procesar ec-corp-andina, borrar out/ec-corp-andina/mapeo.json y abrir 'Ver' en el formulario → 422 'Este archivo no tiene vista previa. Puedes descargarlo para revisarlo.' sin pista de reinicio ni aviso de disco; borrar el archivo y repetir → 404 con la pista y el aviso de disco efímero (G-03-10).
result: pass
reported: "QA T27 (2/2): 422 sin pista de reinicio ni aviso de disco; 404 con pista y aviso. Nota menor: tras el 404 el panel sigue listando el archivo borrado."

### 5. Recetas T09 y T10: health tras un 500 y tope diario
expected: Forzar un 500 ('QA-500') y luego mandar un mensaje correcto → el encabezado pasa de 'No disponible' a 'Disponible' al terminar el turno; con AGENT_DAILY_TOKEN_BUDGET=1, el turno que cruza el tope termina mostrando 'Tope diario' (G-03-14).
result: pass
reported: "QA T28 (2/2): 'No disponible' → 'Disponible' sin recargar; el turno que cruza el tope termina en 'Tope diario'."

### 6. Receta T10: pausa del envío y banner (G-03-15 / LLM-06)
expected: Con Playwright y el LLM falso, arrancar sin LLM_API_KEY; luego con FAKE_FORCE_STATUS=402; luego con AGENT_DAILY_TOKEN_BUDGET=1 y una tarjeta de confirmación abierta; reiniciar con clave y pulsar 'Comprobar de nuevo'. En sin_clave y tope_diario los controles de envío quedan deshabilitados, con la ayuda de pausa en el compositor (aria-describedby) y en la tarjeta; en saldo_agotado el compositor sigue habilitado; al volver a disponible todo se rehabilita sin recargar; 'Comprobar de nuevo' solo genera un GET /api/health; 'Nueva sesión', 'Detener respuesta', Ver, Descargar y Reintentar siguen disponibles en pausa.
result: pass
reported: "QA T29 (4/4): pausa en sin_clave y tope_diario con ayuda; saldo_agotado habilitado; 'Comprobar de nuevo' = 1 GET /api/health y rehabilitación sin recargar. Nota menor: el campo en pausa no se ve atenuado."

### 7. Receta T16: seguimiento de la línea de tiempo (D-78 y D-78.1)
expected: Con Playwright y el LLM falso a 375×667 y 1280×720, 'Procesa el caso ec-corp-andina' y luego el chip 'Los 4 casos'. Sin tocar nada, la distancia al final es de 96 px o menos tras cada turno y no aparece 'Ir al final'. Durante el turno, la primera pulsación de flecha arriba ya despega y aparece 'Ir al final' de 40×40, igual con la rueda, la barra y PageUp con el foco en un mensaje. Enviar otro mensaje la vuelve a pegar. document.scrollingElement.scrollHeight == innerHeight.
result: pass
reported: "Aceptado por la usuaria (2026-10-16) tras quick-261015-t5l y la re-corrida QA de T30 (.qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-16T02-15-41Z.md): 1280×720 pasa completo; a 375×667 la flecha ya despega y aparece Ir al final, pero cuando el contenido crece en dos renders el anclaje de Chromium corrige en dos pasos (d 40→64→40) y la vista vuelve sola al fondo unos 7 s después. Rueda, PageUp, dos flechas, re-pegado al bajar o enviar y sin scroll de documento pasan. Limitación conocida: una sola flecha de 40 px en una vista angosta con teclado (un teléfono no tiene flechas)."

### 8. Human-check de 03-42: sesión nueva, recarga y 'Volver a la sesión anterior' (D-73.5.2)
expected: Procesar ec-corp-andina hasta la tarjeta de confirmación, 'Nueva sesión' → 'Empezar sesión nueva' y recargar → empieza sin sesión y sin la tarjeta anterior. Con NEW_SESSIONS_PER_HOUR=1, abrir una sesión nueva hasta el 429, pulsar 'Volver a la sesión anterior' → trae su historial sin ningún POST /api/chat, y la recarga posterior vuelve a esa sesión.
result: pass
reported: "QA T31 (3/3): la recarga tras 'Empezar sesión nueva' empieza limpia; 'Volver a la sesión anterior' trae el historial sin POST /api/chat y la recarga vuelve a esa sesión."

### 9. Render Events/Logs durante un turno SSE largo en el link público
expected: Los health checks siguen pasando y no hay reinicio mientras corre el stream.
result: pass
reported: "Revisado por la usuaria en Render Events/Logs: health checks pasando y sin reinicio durante un turno SSE largo."

### 10. Prohibición de juicio de 03-35: tope de sesiones a 20
expected: render.yaml no declara AGENT_DAILY_TOKEN_BUDGET ni el presupuesto por sesión (siguen en 2 M y 300 k), así que subir el tope de sesiones a 20 no debilita el tope diario global ni el presupuesto por sesión. Veredicto no autoritativo del verificador: se cumple.
result: pass
reported: "QA T32: render.yaml no declara AGENT_DAILY_TOKEN_BUDGET ni AGENT_SESSION_TOKEN_BUDGET; defaults 2 M y 300 k (agent.constants.ts:75-76). Veredicto de juicio de la usuaria: se cumple."

### 11. Prohibición de 03-32 sin prueba: no consultar /api/health por intervalo
expected: obtenerSalud solo lo llama useSalud().refrescar; el único setInterval de web/src es el reintento de /api/config. Veredicto no autoritativo del verificador: se cumple.
result: pass
reported: "QA T33: obtenerSalud solo desde useSalud().refrescar (montaje, foco, 'Comprobar', fin de turno); único setInterval = reintento de /api/config; 0 pedidos en 70 s inactivo. Veredicto de la usuaria: se cumple."

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-03-7
  truth: "Receta T16 (D-78 y D-78.1): a 375×667, cualquier subida de la usuaria (incluida una flecha de 40 px) despega la línea de tiempo mientras llegan eventos y aparece 'Ir al final'; el anclaje y el encogimiento no cambian el estado"
  status: accepted
  resolution: "quick-261015-t5l (04e0b03, 8aa9bca) corrige el caso de un solo paso de anclaje; el caso de dos pasos se acepta como limitación conocida (override en 03-VERIFICATION.md)"
  reason: "User reported: QA T30 a 375×667 (3/3 reproducciones): con un turno en curso, una flecha arriba despega 40 px pero con el siguiente evento la vista vuelve al fondo y 'Ir al final' nunca aparece; la rueda y PageUp sí despegan; a 1280×720 pasa 5/5. Traza: al despegarse overflow-anchor vuelve a auto, el scroll anchoring empuja la posición hacia abajo y desplazar() lo lee como bajada a ≤ 96 px del fondo y vuelve a pegar (rompe D-78 y D-78.1)."
  severity: major
  test: 7
  root_cause: "desplazar() vuelve a pegar por cercaDelFinal ante cualquier aumento de scrollTop con la vista despegada; con overflow-anchor: auto (solo se anula pegada), el scroll anchoring de Chromium sube scrollTop lo que creció el contenido insertado por encima del ancla (tarjetas del grupo encima de la TarjetaResultado) sin cambiar la distancia; tras una flecha (40 px <= 96) eso se lee como bajada de la usuaria y re-pega. Rueda y PageUp dejan > 96 px y no se ven afectadas; 1280×720 también falla desde el segundo caso del turno"
  artifacts:
    - path: "web/src/state/seguimiento.ts"
      issue: "desplazar() (L46-51) re-pega por umbral ante cualquier aumento de posición; el estado no guarda la distancia y no reconoce la firma del anclaje (Δposición == Δalto, distancia constante)"
    - path: "web/src/components/linea-de-tiempo.tsx"
      issue: "overflow-anchor: none solo con la vista pegada (L197 + module.css L16-18); CRECIMIENTO no lleva geometría"
    - path: "tests/web/seguimiento.test.ts"
      issue: "falta la secuencia de anclaje con la vista despegada; WR-04 modela un AJUSTE_PROPIO despegado que el componente nunca emite"
  missing:
    - "Re-pegar por umbral solo si la distancia al final bajó respecto de la última conocida (guardar distancia en el estado y refrescarla en CRECIMIENTO), o como mínimo mantener overflow-anchor: none también despegada"
    - "Prueba de reductor: ajustePropio(8149), desplazamiento(8108,41), CRECIMIENTO, desplazamiento(8188,41) → pegado false, contenidoNuevo true; bordes 95/96/97 px; despegada que baja de verdad a <= 96 px re-pega"
  debug_session: .planning/debug/seguimiento-375-anclaje-repega.md
