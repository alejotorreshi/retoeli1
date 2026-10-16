---
status: testing
phase: 05-front-web-por-features-e-identidad-de-marca
source: [05-VERIFICATION.md, 05-REVIEW-FIX.md]
started: 2026-10-16T20:48:18Z
updated: 2026-10-16T20:48:18Z
---

## Current Test

number: 1
name: Subir los 108 commits de la fase 5 a origin/main, esperar la CI y el autodeploy de Render, y correr con Playwright MCP (eli-qa) el ensayo del pedido de la sección 11 del PRD sobre el link público, más todos los flujos de D-116 (acceso, estado vacío y tarjetas, turno con herramientas, confirmación, panel de casos, archivos y vista previa, nueva sesión, errores y avisos, layouts ancho y angosto), en local y en el link público, comparando la conducta antes y después del refactor
expected: |
  La CI pasa en verde; el ensayo de la sección 11 da el mismo resultado que en la Fase 3 y 4 (ec-corp-andina BLOQUEADO 13/1/1, sin envío sin confirmación); ningún flujo cambia de conducta
awaiting: eli-qa (Playwright MCP), corrida nocturna

## Tests

### 1. Subir los 108 commits de la fase 5 a origin/main, esperar la CI y el autodeploy de Render, y correr con Playwright MCP (eli-qa) el ensayo del pedido de la sección 11 del PRD sobre el link público, más todos los flujos de D-116 (acceso, estado vacío y tarjetas, turno con herramientas, confirmación, panel de casos, archivos y vista previa, nueva sesión, errores y avisos, layouts ancho y angosto), en local y en el link público, comparando la conducta antes y después del refactor
expected: La CI pasa en verde; el ensayo de la sección 11 da el mismo resultado que en la Fase 3 y 4 (ec-corp-andina BLOQUEADO 13/1/1, sin envío sin confirmación); ningún flujo cambia de conducta
result: [pending]

### 2. Encabezado angosto con logo a 375 x 667 y 320 x 568
expected: La línea 1 (logo de 24 px, divisor neón, título Outfit 16) cabe en una sola línea sin tapar el logo; la línea 2 sigue en una fila con elipsis
result: [pending]

### 3. Chips compactos en píldora con Montserrat a 375 x 667 con historial
expected: Ocupan como máximo dos filas y nunca hacen scroll horizontal
result: [pending]

### 4. Pantalla de acceso con marca: escribir un código errado
expected: El mensaje se ve dentro de la tarjeta blanca en --error-texto, se anuncia y el foco vuelve al campo
result: [pending]

### 5. Pantalla de acceso con marca mientras verifica el código
expected: La píldora Entrar al agente conserva el estado ocupado, no hay doble envío y el texto ocupado se lee
result: [pending]

### 6. Primera carga en frío del link público (encabezado sin salud ni fecha todavía)
expected: Sobre el teal no queda un hueco ni un punto huérfano
result: [pending]

### 7. Nombre largo del modelo de /api/health a 320 x 568
expected: El prefijo se oculta y el resto va con elipsis en la línea 2
result: [pending]

### 8. Tarjeta de caso con un slug de 60 caracteres a 375 x 667 y 1280 x 720
expected: overflow-wrap anywhere en cliente y slug: la tarjeta crece en alto y nunca desborda su columna
result: [pending]

### 9. Interrumpir un turno que transmite (Detener, recargar la página y Nueva sesión durante el turno), en local y en el link público
expected: La conducta es la misma que en la Fase 3 (comparación antes y después)
result: [pending]

### 10. Cortar /api/config después de entrar (revisión WR-03) y mirar el estado vacío
expected: Se ve y se anuncia (role=status) 'No se pudieron cargar los casos. Se vuelve a intentar en unos segundos; mientras tanto puedes escribir la instrucción.'; los chips y el compositor siguen usables; la grilla aparece cuando el reintento responde
result: [pending]

### 11. Revisar en el navegador que el neón #6DFD8C nunca se usa como texto o control sobre una superficie clara
expected: El neón solo aparece en el teal (divisor, punto Disponible, borde de Nueva sesión, foco en el encabezado y en las pantallas teal de acceso y carga); dentro de la tarjeta blanca de acceso el foco es --acento
result: [pending]

### 12. Revisión visual de la identidad de marca (logo, encabezado teal, Outfit y Montserrat cargadas, píldoras, grilla de tarjetas 2 x 2 en ancho y 1 columna en angosto, favicon y título de la pestaña)
expected: La app se reconoce como de Periferia IT Group, chat-first y en claro, como describe 05-UI-SPEC.md
result: [pending]

### 13. Reconocer dos prohibiciones de nivel test sin una prueba que las haga cumplir: (a) la compuerta de cadena de suministro (sin versiones de menos de 7 días ni scripts de instalación) y (b) la atribución de marca en SOLUCION.md
expected: (a) El verificador comprobó en este pase que los 5 paquetes no declaran preinstall/install/postinstall y que el más reciente (happy-dom 20.14.6, 2026-10-08T23:18Z) tenía 7 d 18 h al instalarse (36727e4, 2026-10-16T17:42Z). (b) La atribución está en SOLUCION.md:137, pero ninguna prueba la exige
result: [pending]

### 14. Vista previa abierta mientras el agente procesa los 4 casos (revisión de código iter. 2, WR-01)
expected: Con la vista previa de un archivo del caso A abierta, al pasar el agente al caso B el diálogo sigue visible fuera del bloque plegable, el bloque de A no se pliega y al cerrar el foco vuelve a "Ver"
result: [pending]

### 15. 401 en /api/config justo después de un código aceptado (revisión de código iter. 3, IN-01) y chips/tarjetas durante la recarga de sesión (iter. 2, IN-07)
expected: Bloqueando la cookie tras un código correcto, el mensaje del servidor aparece como aviso del sistema arriba del campo (no como error del campo); durante la hidratación de una sesión, chips, tarjetas y "procesar de nuevo" se ven deshabilitados
result: [pending]

## Summary

total: 15
passed: 0
issues: 0
pending: 15
skipped: 0
blocked: 0

## Gaps
