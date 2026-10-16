---
status: complete
phase: 04-m-dulo-documentaci-n-y-defensa
source: [04-VERIFICATION.md, 04-REVIEW-FIX.md]
started: 2026-10-16T05:53:02Z
updated: 2026-10-16T06:30:00Z
---

## Current Test

[testing complete]

## Tests

Veredictos automáticos de la corrida nocturna desatendida. Los decidió el orquestador según la recomendación del runner de eli-qa y quedan pendientes de revisión humana. La evidencia está en `.qa/evidence/04-m-dulo-documentaci-n-y-defensa/04-QA-EVIDENCE-2026-10-16T05-53-02Z.md`.

### 1. modulo/ como fuente única: generador idempotente, igualdad byte a byte, identidad e importación sin env
expected: `bun run modulo` dos veces deja `git diff -- modulo` vacío. Los cuerpos de agent.md y SKILL.md son byte a byte el prompt y el conocimiento, el frontmatter cumple el PRD §9.4 y las herramientas son `===` a las de la app.
result: pass

### 2. La deriva se detecta: editar el prompt o el conocimiento sin regenerar rompe el test, y regenerar lo arregla
expected: los tests de modulo fallan tras editar la fuente y pasan después de `bun run modulo`.
result: pass

### 3. Un dev nuevo levanta el proyecto siguiendo solo el README
expected: en un clon limpio, `bun install`, la demo con exit 0 y `bun run dev` responden health 200 en menos de 120 s.
result: pass

### 4. Documentación: SOLUCION.md con las 10 secciones, README §9.2, continuidad e historial
expected: tests/docs da 0 fail, las 10 secciones están en orden, la identidad es solo elianatorres5772 y todos los commits siguen Conventional Commits.
result: pass
note: "Pendiente humano: la usuaria revisa la redacción de SOLUCION.md §9 (D-87)."

### 5. Regresión y CI local en una copia limpia
expected: check, test, demo, build:web y audit terminan con 0, y la simulación de la CI da CI_LOCAL_OK.
result: pass
note: "Re-corrida del 2026-10-16T06:26:20Z, después de 04-08: CI_LOCAL_OK en una copia hecha con git archive y sin .git (2477 pass, 3 skip, 0 fail); en el checkout, 2478 pass, 2 skip, 0 fail."
previous_report: "En una copia sin .git (como un ZIP descargado de GitHub), bun test da 2475 pass y 1 fail: el test WR-02 de tests/modulo/generador.test.ts llama a `git check-attr`, que termina con 128 fuera de un repo. Con git init, que es como corre la CI real, pasa con 2476/0."

### 6. Render sirve HEAD tras checksPass y el acceso sigue cerrado
expected: health 200 sin secretos, el bundle servido es igual al build local de HEAD y las rutas protegidas responden 401.
result: pass
note: "Pendiente humano: confirmar en la UI de GitHub Actions la corrida verde y el badge, y en Render Events que el deploy esperó los checks. La evidencia indirecta de que la CI pasó es que Render ya sirve el bundle de dec6481."

### 7. Pre-flight por defecto contra el link público con el código del README
expected: exit 0; health, acceso, fecha 2026-09-03 y caso ec-corp-andina; el código no aparece en la salida.
result: pass

### 8. Pre-flight --guion: el §11 completo por SSE sobre Render
expected: exit 0. En el turno 1 hay confirmación y bloqueo y todavía no existe ENVIO-SIMULADO.md; en el turno 2 aparece ENVIO-SIMULADO.md. Se reportan los tokens y el SSE llega por partes sin depender de X-Accel-Buffering.
result: pass

### 9. Ensayo del guion §11 en el navegador sobre el link público (Playwright)
expected: el flujo completo funciona con el modelo real, se pide confirmación antes del envío y ENVIO-SIMULADO.md aparece solo después de "envía".
result: pass
note: "Seguimiento menor G-04-2: una sesión nueva muestra por un momento los archivos que dejó otra sesión del mismo caso. Pendiente humano: la usuaria ensaya el guion una vez a mano."

### 10. Sin secretos ni PII en lo commiteado de la fase
expected: la clave del LLM no está en git, el código de acceso aparece solo en el README y no hay valores del maestro.
result: pass

### 11. El módulo dentro de una sesión real de OpenCode
expected: aparecen el agente, la skill y las herramientas proveedor_*.
result: skipped
reason: "Deferred follow-up: fuera de alcance por D-83: no se instala OpenCode. La evidencia está en tests/modulo/opencode.test.ts. Probarlo es opcional y le corresponde a la usuaria."

## Summary

total: 11
passed: 10
issues: 0
pending: 0
skipped: 1
blocked: 0

## Deferred Follow-Ups

- test: 11
  idea: "Opcional: abrir el repo en OpenCode y confirmar que aparecen el agente registro-proveedor, la skill y las herramientas proveedor_* desde modulo/ (D-83 no exige un ensayo en vivo)"
  deferred_at: 2026-10-16

## Gaps

- gap_id: G-04-1
  truth: "Un dev nuevo que descarga el repo y corre `bun test` obtiene 0 fallos (criterios 2 y 4 de la Fase 4)"
  status: resolved
  reason: "QA T05: en una copia sin .git, bun test da 2475 pass y 1 fail en el test WR-02 (.gitattributes fija LF), porque `git check-attr` termina con 128 fuera de un repo de git."
  severity: minor
  test: 5
  resolution: "04-08 (6ed1804): el test WR-02 lee .gitattributes directamente y usa git check-attr solo dentro del checkout del proyecto; la re-corrida de QA T05 pasa sin .git"
  root_cause: "tests/modulo/generador.test.ts (alrededor de L108-109, el test agregado por el fix WR-02 de 04-REVIEW-FIX) da por hecho que existe un checkout de git y depende de `git check-attr` para resolver el atributo eol."
  artifacts:
    - path: "tests/modulo/generador.test.ts"
      issue: "el test de .gitattributes ejecuta `git check-attr` sin comprobar que el árbol sea un repo de git"
  missing:
    - "Que el test no dependa de git: leer y validar `.gitattributes` directamente (`* text=auto eol=lf`, `*.md text eol=lf`) y comprobar que los archivos fuente y generados del módulo no contienen CR. Usar `git check-attr` solo si `git rev-parse --is-inside-work-tree` tiene éxito."
    - "Prueba: el test pasa en una copia sin .git (git archive HEAD | tar -x en un scratch y bun test tests/modulo)."

- gap_id: G-04-2
  truth: "En la defensa, una sesión nueva no muestra archivos viejos de otra sesión que puedan confundirse con un envío ya hecho (criterio 5: la defensa sin sorpresas)"
  status: resolved
  resolution: "04-08 (0d42f41), solo documentación: docs/entrega.md pasa --guion y los ensayos a la víspera y explica qué son los archivos viejos; SOLUCION.md §10 registra el riesgo y el arreglo para producción; el README ya lo refleja. La parte operativa (que Render vacíe out/ al dormirse entre la víspera y la defensa) queda para que la usuaria la observe ese día"
  reason: "QA T09: después de correr --guion (T08), una sesión nueva del navegador mostró por un momento ENVIO-SIMULADO.md y el resto del paquete de la corrida anterior del mismo caso, hasta que armar_paquete lo reconstruyó en el turno 1 (capturas 04-test09-03 y 04-test09-04)."
  severity: minor
  test: 9
  root_cause: "out/<caso>/ se comparte entre sesiones por diseño de las fases 1 a 3 (el estado está en memoria y el disco es efímero). El panel de archivos lista lo que hay en out/<caso>/ hasta que generar_formulario o armar_paquete lo reemplazan. Cambiar esto es conducta de la API o de la SPA, y queda fuera del alcance de la Fase 4."
  artifacts:
    - path: "docs/entrega.md"
      issue: "la checklist de la defensa no advierte que el pre-flight --guion deja archivos del caso ec-corp-andina que se ven en la sesión de la demo hasta el turno 1"
    - path: "SOLUCION.md"
      issue: "la sección de riesgos (§10) no menciona que out/<caso>/ se comparte entre sesiones"
  missing:
    - "Documentarlo sin cambiar la conducta: en docs/entrega.md, ordenar la víspera para que --guion se corra con margen y explicar que el panel puede mostrar el paquete de la corrida anterior hasta que el turno 1 lo reconstruye. En SOLUCION.md §10, agregar el riesgo de out/<caso>/ compartido entre sesiones y qué haría un despliegue real (out/ por sesión o almacenamiento de objetos)."
