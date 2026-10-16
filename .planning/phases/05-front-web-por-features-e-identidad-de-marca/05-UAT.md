---
status: complete
phase: 05-front-web-por-features-e-identidad-de-marca
source: [05-VERIFICATION.md, 05-REVIEW-FIX.md]
started: 2026-10-16T20:48:18Z
updated: 2026-10-16T23:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Subir los 108 commits de la fase 5 a origin/main, esperar la CI y el autodeploy de Render, y correr con Playwright MCP (eli-qa) el ensayo del pedido de la sección 11 del PRD sobre el link público, más todos los flujos de D-116 (acceso, estado vacío y tarjetas, turno con herramientas, confirmación, panel de casos, archivos y vista previa, nueva sesión, errores y avisos, layouts ancho y angosto), en local y en el link público, comparando la conducta antes y después del refactor
expected: La CI pasa en verde; el ensayo de la sección 11 da el mismo resultado que en la Fase 3 y 4 (ec-corp-andina BLOQUEADO 13/1/1, sin envío sin confirmación); ningún flujo cambia de conducta
result: pass
retest: "re-run tras el cierre de brechas (05-10, 05-11): T01a-r pass, .qa/evidence/05-front-web-por-features-e-identidad-de-marca/05-QA-EVIDENCE-2026-10-16T23-31-00Z.md"
previous_result: issue
reported: "El ensayo de la sección 11 en el link público da 13/1/1 BLOQUEADO sin envío sin confirmación y la CI está en verde (confirmado por la usuaria), y los flujos de D-116 hacen las mismas 23 llamadas antes y después; pero el estado vacío con las tarjetas nuevas abre desplazado al fondo a 1280x720 y 375x667, con '¿Qué caso procesamos?' (y a 375 las tarjetas CO y EC) fuera de la vista; antes del refactor cabía sin scroll"
severity: major
evidence: .qa/evidence/05-front-web-por-features-e-identidad-de-marca/05-QA-EVIDENCE-2026-10-16T22-05-00Z.md (T01a F1, T01b)

### 2. Encabezado angosto con logo a 375 x 667 y 320 x 568
expected: La línea 1 (logo de 24 px, divisor neón, título Outfit 16) cabe en una sola línea sin tapar el logo; la línea 2 sigue en una fila con elipsis
result: pass
retest: "re-run tras el cierre de brechas (05-10, 05-11): T02-r pass, .qa/evidence/05-front-web-por-features-e-identidad-de-marca/05-QA-EVIDENCE-2026-10-16T23-31-00Z.md"
previous_result: issue
reported: "A 320x568 el título 'Registro como proveedor' se parte en dos líneas (38,4 px, el encabezado crece a 102 px), contra 05-UI-SPEC.md:509; además a 375 y 320 la fecha y el estado del modelo se truncan ('2026-09-…', 'Disponi…')"
severity: minor
evidence: .qa/evidence/05-front-web-por-features-e-identidad-de-marca/05-QA-EVIDENCE-2026-10-16T22-05-00Z.md (T02)

### 3. Chips compactos en píldora con Montserrat a 375 x 667 con historial
expected: Ocupan como máximo dos filas y nunca hacen scroll horizontal
result: pass

### 4. Pantalla de acceso con marca: escribir un código errado
expected: El mensaje se ve dentro de la tarjeta blanca en --error-texto, se anuncia y el foco vuelve al campo
result: pass
note: se anuncia por aria-describedby con el foco de vuelta en el campo; no hay región viva propia

### 5. Pantalla de acceso con marca mientras verifica el código
expected: La píldora Entrar al agente conserva el estado ocupado, no hay doble envío y el texto ocupado se lee
result: pass

### 6. Primera carga en frío del link público (encabezado sin salud ni fecha todavía)
expected: Sobre el teal no queda un hueco ni un punto huérfano
result: pass
note: frío simulado en local y en el link sin hueco ni punto huérfano; el arranque en frío real de Render (>15 min inactivo) queda diferido para antes de la defensa

### 7. Nombre largo del modelo de /api/health a 320 x 568
expected: El prefijo se oculta y el resto va con elipsis en la línea 2
result: pass

### 8. Tarjeta de caso con un slug de 60 caracteres a 375 x 667 y 1280 x 720
expected: overflow-wrap anywhere en cliente y slug: la tarjeta crece en alto y nunca desborda su columna
result: pass
note: con el slug partido a 375 el '·' queda al final de la primera línea

### 9. Interrumpir un turno que transmite (Detener, recargar la página y Nueva sesión durante el turno), en local y en el link público
expected: La conducta es la misma que en la Fase 3 (comparación antes y después)
result: pass
note: Detener, recarga y Nueva sesión iguales antes y después en local; en el link público Detener verificado, la recarga durante el stream no se corrió en remoto (presupuesto de 3 turnos)

### 10. Cortar /api/config después de entrar (revisión WR-03) y mirar el estado vacío
expected: Se ve y se anuncia (role=status) 'No se pudieron cargar los casos. Se vuelve a intentar en unos segundos; mientras tanto puedes escribir la instrucción.'; los chips y el compositor siguen usables; la grilla aparece cuando el reintento responde
result: pass

### 11. Revisar en el navegador que el neón #6DFD8C nunca se usa como texto o control sobre una superficie clara
expected: El neón solo aparece en el teal (divisor, punto Disponible, borde de Nueva sesión, foco en el encabezado y en las pantallas teal de acceso y carga); dentro de la tarjeta blanca de acceso el foco es --acento
result: pass

### 12. Revisión visual de la identidad de marca (logo, encabezado teal, Outfit y Montserrat cargadas, píldoras, grilla de tarjetas 2 x 2 en ancho y 1 columna en angosto, favicon y título de la pestaña)
expected: La app se reconoce como de Periferia IT Group, chat-first y en claro, como describe 05-UI-SPEC.md
result: pass
note: veredicto de la usuaria con las capturas 05-testT12-*

### 13. Reconocer dos prohibiciones de nivel test sin una prueba que las haga cumplir: (a) la compuerta de cadena de suministro (sin versiones de menos de 7 días ni scripts de instalación) y (b) la atribución de marca en SOLUCION.md
expected: (a) El verificador comprobó en este pase que los 5 paquetes no declaran preinstall/install/postinstall y que el más reciente (happy-dom 20.14.6, 2026-10-08T23:18Z) tenía 7 d 18 h al instalarse (36727e4, 2026-10-16T17:42Z). (b) La atribución está en SOLUCION.md:137, pero ninguna prueba la exige
result: pass
note: (a) 0 scripts de instalación, happy-dom 7,77 d al instalarse, audit limpio; (b) atribución en SOLUCION.md:137 sin prueba que la exija (seguimiento opcional en tests/docs/solucion.test.ts)

### 14. Vista previa abierta mientras el agente procesa los 4 casos (revisión de código iter. 2, WR-01)
expected: Con la vista previa de un archivo del caso A abierta, al pasar el agente al caso B el diálogo sigue visible fuera del bloque plegable, el bloque de A no se pliega y al cerrar el foco vuelve a "Ver"
result: pass

### 15. 401 en /api/config justo después de un código aceptado (revisión de código iter. 3, IN-01) y chips/tarjetas durante la recarga de sesión (iter. 2, IN-07)
expected: Bloqueando la cookie tras un código correcto, el mensaje del servidor aparece como aviso del sistema arriba del campo (no como error del campo); durante la hidratación de una sesión, chips, tarjetas y "procesar de nuevo" se ven deshabilitados
result: pass

## Summary

total: 15
passed: 15
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Ningún flujo cambia de conducta tras el refactor: el estado vacío se ve completo desde arriba (título, explicación y tarjetas de caso) al entrar, como antes"
  status: resolved
  reason: "User reported: el estado vacío con las tarjetas nuevas abre desplazado al fondo a 1280x720 (scrollTop 183/183) y 375x667 (scrollTop 459); '¿Qué caso procesamos?' y su explicación (y a 375 las tarjetas CO y EC) quedan fuera de la vista. El front de antes (b7446861) cabía sin scroll; a 1280x1000 cabe"
  severity: major
  test: 1
  root_cause: "El seguimiento al final de la línea de tiempo actúa también sobre el estado vacío: seguimiento.ts:9 arranca con pegado: true y el ResizeObserver de .contenido en usar-linea-de-tiempo.ts:69-71 llama a seguirAlFinal (scrollTop = scrollHeight, línea 59) en su primer aviso al montar, sin excluir turnos.length === 0. EstadoVacio vive dentro de .contenido (linea-de-tiempo.tsx:67,100-102). El defecto existe desde 03-07; lo destapó la grilla de casos de 05-09 (contenido 630 px vs zona 495 px a 1280x720; 741 vs 330 a 375x667). Mismo mecanismo tras Nueva sesión pegada, recarga de una sesión sin turnos y, por código, la grilla que llega tarde con el reintento WR-03; secundario: el seguimiento sobrevive al cambio de sesión ('Ir al final' sobre el estado vacío)"
  artifacts: [web/src/features/chat/linea-de-tiempo/usar-linea-de-tiempo.ts, web/src/features/chat/estado/seguimiento.ts, web/src/features/chat/linea-de-tiempo/linea-de-tiempo.tsx, .qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/05-testT01a-after-vacio.png, .qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/05-testT01a-after-375-vacio.png]
  missing: ["que el seguimiento al final no actúe mientras no haya turnos y se reinicie al volver al estado vacío (sin 'Ir al final')", "una prueba con layout real o alturas simuladas que exija scrollTop 0 en el estado vacío a 1280x720 y 375x667, también tras Nueva sesión y recarga"]
  debug_session: .planning/debug/estado-vacio-abre-al-fondo.md
  resolved_by: 05-10 (6a8a96a, ac1a050); re-run T01a-r pass

- truth: "A 320x568 la línea 1 del encabezado (logo, divisor, título Outfit 16) cabe en una sola línea; el título no se parte (05-UI-SPEC.md:509)"
  status: resolved
  reason: "User reported: a 320x568 el título 'Registro como proveedor' se parte en dos líneas (alto 38,4 px, encabezado de 102 px); a 375 y 320 la fecha y el estado del modelo se truncan con elipsis ('2026-09-…', 'Disponi…') porque compiten por 343 px"
  severity: minor
  test: 2
  root_cause: "El código cumple la UI-SPEC, pero sus medidas no caben: la línea 1 se calculó solo a 375 (05-UI-SPEC.md:137) y necesita logo 96 + 16 + divisor 1 + 16 + título 182,2 = 311,2 px frente a 288 px útiles a 320 (sobran 23,2 px), así que el título encoge (encabezado.module.css:18,22-30) y se parte; el chequeo de la línea 509 nunca puede pasar. En la línea 2, Montserrat 14 con dígitos tabulares (05-08) hace que fecha + estado + 'Nueva sesión' (que no encoge, :107, 129,4 px) pidan 345-388 px según el estado frente a 343 px a 375, y ambas pastillas encogen con elipsis (:51-52,67-69); la elipsis está especificada, pero la maqueta de la línea 133 muestra la fecha completa y Fase 3 ocultó el prefijo para que la fecha se leyera"
  artifacts: [web/src/features/encabezado/encabezado/encabezado.module.css, web/src/styles/tokens.css, .planning/phases/05-front-web-por-features-e-identidad-de-marca/05-UI-SPEC.md, .qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/05-testT02-encabezado-320.png, .qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/05-testT02-encabezado-375.png]
  missing: ["enmendar la UI-SPEC con medidas angostas calculadas contra 288 px (línea 1) y 343 px en Montserrat (línea 2)", "línea 1: logo de 20 px con huecos de 8 px junto al divisor (279,2 px) o título 14 con huecos de 8 (272,5 px), o apilar/ocultar el título bajo unos 344 px con un valor nuevo de CONSULTA_DE_ANCHO (W25)", "línea 2: la fecha no encoge y/o 'Nueva sesión' pasa a solo icono con aria-label en angosto (libera unos 89 px: todos los estados caben a 375)"]
  debug_session: .planning/debug/encabezado-angosto-titulo-partido.md
  resolved_by: 05-11 (c06a5b7, e8c9d84, 2dd45a9); re-run T02-r pass
