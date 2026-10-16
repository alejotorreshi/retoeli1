---
phase: quick-261016-ehz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .gitignore
  - docs/entrega.md
  - README.md
  - SOLUCION.md
  - tests/docs/readme.test.ts
  - tests/docs/solucion.test.ts
autonomous: true
requirements: [DOC-01, DOC-02]

estimate:
  tokens: 35000
  raw_tokens: 35000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "docs/entrega.md ya no está en el repositorio: git ls-files no lo lista y el archivo no existe en docs/"
    - "La checklist sigue en la máquina de la usuaria como .local/entrega.md, byte a byte igual a la versión commiteada (blob 01b782af0ed62814531e3393084295674e5919d9), y git check-ignore la reporta ignorada por la línea .local/ de .gitignore"
    - "README.md, SOLUCION.md, docs/** y modulo/README.md no enlazan ni nombran entrega.md, y el README ya no tiene la sección ## Entrega"
    - "Los pasos operativos siguen a la vista del evaluador (G-04-2): la línea del pre-flight del README dice que el modo por defecto va 10 minutos antes y que el `--guion` va la víspera, y SOLUCION.md §10 conserva la víspera, el `--guion`, ENVIO-SIMULADO.md y el turno 1"
    - "Los escaneos de secretos, modelos retirados y PII siguen cubriendo README.md, SOLUCION.md, cada .md de docs/ (documentosMarkdown) y modulo/README.md, y pasan sin docs/entrega.md"
    - "El código de acceso sigue literal en el README (D-94), reto-01/ no cambia, y bun run check y bun test terminan en verde"
  artifacts:
    - path: ".gitignore"
      provides: "ignora la carpeta local .local/ para que la copia nunca vuelva al índice"
      contains: ".local/"
    - path: ".local/entrega.md"
      provides: "copia local de la checklist, sin rastrear (no se commitea)"
      contains: "## Pendientes humanos"
    - path: "README.md"
      provides: "pre-flight que apunta al riesgo de SOLUCION.md §10 en lugar de la checklist; sin sección Entrega"
      contains: "el riesgo está en [SOLUCION.md](SOLUCION.md) §10"
    - path: "tests/docs/readme.test.ts"
      provides: "G-04-2 sobre el README y el guardián de la checklist fuera del repositorio (archivo ausente, ninguna mención pública, .local/ ignorada)"
      contains: "fuera del repositorio"
    - path: "tests/docs/solucion.test.ts"
      provides: "§10 exige la víspera, el --guion, ENVIO-SIMULADO.md y el turno 1 (G-04-2)"
      contains: "víspera"
  key_links:
    - from: ".gitignore"
      to: ".local/entrega.md"
      via: "la línea .local/ hace que git check-ignore la reporte y que git add no la tome"
      pattern: "^\\.local/$"
    - from: "tests/docs/readme.test.ts"
      to: "README.md, SOLUCION.md, docs/**, modulo/README.md"
      via: "el guardián recorre documentosMarkdown(RAIZ, CARPETA_DOCS) más README, SOLUCION y modulo/README.md buscando el nombre del archivo retirado"
      pattern: "documentosMarkdown\\(RAIZ, CARPETA_DOCS\\)"
    - from: "README.md"
      to: "SOLUCION.md"
      via: "la línea del pre-flight remite al riesgo de out/<caso>/ compartido en §10"
      pattern: "SOLUCION\\.md\\]\\(SOLUCION\\.md\\) §10"
---

<objective>
Sacar la checklist docs/entrega.md del repositorio que ven los evaluadores y dejar una copia local ignorada por git, por decisión de la usuaria del 2026-10-16: la checklist trae sus pendientes personales (rotar el código, revisar §9) y el evaluador no debe verla. Enmienda D-99, que dejaba los pendientes humanos "en el README o la checklist de entrega": ahora viven solo en la copia local.

Purpose: que el repositorio entregado no muestre la lista de pendientes personales, sin perder la información operativa útil para el evaluador (pre-flight la víspera con --guion y el modo por defecto 10 minutos antes), que ya está en el README y en SOLUCION.md §10.
Output: .local/entrega.md sin rastrear, .gitignore con .local/, README.md y SOLUCION.md sin el enlace, y pruebas de documentación que ya no exigen la checklist y vigilan que no vuelva.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md
@docs/entrega.md
@tests/docs/readme.test.ts
@tests/docs/solucion.test.ts
@tests/helpers/documentos.helper.ts

Ubicaciones exactas (ya medidas, no hace falta explorar más):
- README.md L174 (sección "## Pre-flight de la defensa"): la viñeta que empieza "Unos 10 minutos antes de la defensa conviene correr el modo por defecto" termina su segunda oración con "hasta su turno 1" seguido del enlace entre paréntesis a docs/entrega.md.
- README.md L202-204: la sección "## Entrega" (encabezado, línea en blanco y una sola línea que remite a docs/entrega.md). Es lo último del archivo; L200 es la viñeta de modulo/README.md de "## Documentación" y L201 está en blanco.
- SOLUCION.md L259 (§10, viñeta "`out/<caso>/` compartido entre sesiones") y L266 (§10, viñeta "Operación de la defensa"): cada una termina con el enlace entre paréntesis a docs/entrega.md.
- Ningún otro archivo publicado lo nombra: docs/arquitectura.md, docs/convenciones.md, docs/estructura.md, docs/limites-del-demo.md, docs/plantillas.md, modulo/README.md, .github/, .claude/ y .qa/suites/ no lo mencionan (git grep). La L59 de docs/estructura.md usa el verbo "entrega", no el archivo.
- Las menciones en .planning/ y en .qa/evidence/ son registros históricos y no se tocan.
- El Dockerfile copia rutas explícitas (src, agent, reto-01/fixtures, web, tsconfig), así que .local/ nunca entra a la imagen y .dockerignore no cambia.
- tests/docs/readme.test.ts depende de la checklist en: la constante ENTREGA (L20) y su uso en ENLACES_README (L66); PENDIENTES_ENTREGA (L72-82), CORRIDA_ANTERIOR_ENTREGA (L83), PATRON_TAREA (L33), SIN_GUION (L86) y VISPERA (L84), que solo usa el describe de la checklist; el describe `${ENTREGA} (D-99)` (L166-189), con sus tres pruebas: pendientes como tareas, costo pendiente y G-04-2; estadoDeEvidencia() y la importación de ESTADO_EVIDENCIA_COSTO, que solo usa la prueba del costo (RUTA_EVIDENCIA_COSTO sigue en uso); y el test.each([README, ENTREGA]) de enlaces (L220).
- La evidencia de costo pendiente ya la vigila solucion.test.ts §4 (texto "pendiente de corrida" contra el estado de la evidencia), así que la prueba de la checklist sobre "bun run costo" se retira sin perder cobertura. "bun run costo" sigue exigido en el README por COMANDOS.
- Blob de la checklist en HEAD: 01b782af0ed62814531e3393084295674e5919d9 (git rev-parse HEAD:docs/entrega.md).
- El árbol ya tiene cambios ajenos (.planning/config.json, .planning/state.json, .planning/research/.cache/, .planning/ui-reviews/). No se stagean: cada commit agrega rutas explícitas, nunca git add -A ni git add con un punto.

Contribuciones plan:pre: ai-integration no aplica (solo documentación y pruebas de documentación); assumption-delta no aplica (tarea rápida fuera del ROADMAP); schema-gate no aplica (sin esquemas ni ORM); security aplica con ASVS L1 y bloqueo en high: ver `<threat_model>`.
</context>

<tasks>

<!-- planner-discipline-allow: entrega.md -->

<task type="tracer">
  <name>Task 1: Tracer: la checklist sale del índice con copia local ignorada, README y SOLUCION quedan sin el enlace y las pruebas de docs pasan</name>
  <files>.gitignore, .local/entrega.md (sin rastrear), docs/entrega.md (borrado), README.md, SOLUCION.md, tests/docs/readme.test.ts</files>
  <action>
1. Copia local primero, para no perder el contenido: crear la carpeta .local en la raíz y copiar docs/entrega.md a .local/entrega.md sin cambiar un byte. No se ajustan sus enlaces relativos ni su texto: la copia es la checklist de la usuaria tal cual.
2. En .gitignore, agregar una línea .local/ en el bloque de carpetas locales, junto a .playwright-mcp/ y .codegraph/. Comprobar con git check-ignore -v .local/entrega.md que la regla nueva la toma.
3. Sacar el original del índice y del árbol con git rm -q docs/entrega.md. Así docs/ ya no lo tiene y el escaneo de documentosMarkdown deja de verlo también en local.
4. README.md:
   - En la viñeta del pre-flight (L174), reemplazar el paréntesis con el enlace a la checklist por "(el riesgo está en [SOLUCION.md](SOLUCION.md) §10)". El resto de la viñeta no cambia; en particular "el modo por defecto" y "El `--guion` se corre la víspera" quedan en la misma línea que "10 minutos antes".
   - Borrar la sección "## Entrega" completa: el encabezado, su párrafo y la línea en blanco que la precede. El archivo termina en la viñeta de modulo/README.md, con un solo salto de línea final.
   - No tocar el código de acceso ni la viñeta de rotación de la sección del link (D-94).
5. SOLUCION.md §10:
   - L259: quitar el paréntesis con el enlace al final de la viñeta; termina en "se corren la víspera.".
   - L266: quitar el paréntesis con el enlace al final de la viñeta; termina en "se rota después de la evaluación.". Esa oración se conserva: es la postura de seguridad (D-94) que ya dice el README en su sección del link, no un pendiente de la checklist.
   - Nada más cambia en SOLUCION.md.
6. tests/docs/readme.test.ts, adaptación mínima para que la suite no exija la checklist:
   - Borrar la constante ENTREGA y su entrada en ENLACES_README. Renombrar la prueba "enlaza la solución, la documentación de continuidad, la entrega y el módulo" a "enlaza la solución, la documentación de continuidad y el módulo".
   - Borrar el describe `${ENTREGA} (D-99)` y lo que solo él usaba: PENDIENTES_ENTREGA, CORRIDA_ANTERIOR_ENTREGA, PATRON_TAREA, SIN_GUION, VISPERA, estadoDeEvidencia() y la importación de ESTADO_EVIDENCIA_COSTO. Conservar RUTA_EVIDENCIA_COSTO y ANTES_DE_LA_DEFENSA.
   - Mover G-04-2 al README: en el describe "el pre-flight documentado (IN-01)", renombrado a "el pre-flight documentado (IN-01, G-04-2)", agregar la prueba "programa el modo por defecto 10 minutos antes y el --guion la víspera (G-04-2)". Busca la línea del README que contiene ANTES_DE_LA_DEFENSA, exige que exista y que contenga dos constantes nuevas: MODO_POR_DEFECTO ("el modo por defecto") y GUION_LA_VISPERA ("El `--guion` se corre la víspera").
   - Cambiar test.each([README, ENTREGA]) de enlaces por una sola prueba sobre README con el mismo cuerpo (texto no vacío y enlacesRotos(RAIZ, README, [SOLUCION]) vacío), con el nombre armado desde la constante README.
   - Sin comentarios en el código (regla del proyecto). Formatear con bunx biome check --write tests/docs/readme.test.ts si hace falta.
7. Correr el verify. Commit con la identidad local y con rutas explícitas: git add .gitignore README.md SOLUCION.md tests/docs/readme.test.ts (la baja de docs/entrega.md ya quedó stageada por git rm). Mensaje: "docs(quick-261016-ehz): saca la checklist de entrega del repositorio y deja una copia local ignorada". Termina con las líneas Co-Authored-By y Claude-Session indicadas. Antes de commitear, git status --short no debe mostrar .local/.
  </action>
  <verify>
    <automated>test -f .local/entrega.md && test "$(git hash-object .local/entrega.md)" = 01b782af0ed62814531e3393084295674e5919d9 && test ! -e docs/entrega.md && git check-ignore -q .local/entrega.md && test -z "$(git ls-files docs/entrega.md .local)" && ! grep -rq 'entrega.md' README.md SOLUCION.md docs modulo/README.md && ! grep -q '^## Entrega' README.md && grep -q 'el riesgo está en \[SOLUCION.md\](SOLUCION.md) §10' README.md && bun test tests/docs && bunx biome check tests/docs/readme.test.ts</automated>
    <fails_when>Falla si la copia local falta o no es idéntica al blob commiteado; si docs/entrega.md sigue en el árbol o en el índice; si .local/ no está ignorada o algo de .local/ quedó rastreado; si README.md, SOLUCION.md, docs/ o modulo/README.md todavía nombran entrega.md; si queda la sección ## Entrega o falta la remisión a §10; o si alguna prueba de tests/docs/ o Biome falla (por ejemplo, una constante huérfana o un enlace roto).</fails_when>
  </verify>
  <done>
    - .local/entrega.md existe, es idéntica a la versión commiteada y git la ignora; docs/entrega.md no existe ni está en el índice.
    - README.md y SOLUCION.md no enlazan la checklist; el README ya no tiene la sección Entrega y remite a SOLUCION.md §10.
    - bun test tests/docs pasa, con G-04-2 comprobado sobre la línea del pre-flight del README.
    - Un commit con la identidad local que no incluye .local/ ni los cambios ajenos de .planning/.
  </done>
</task>

<task type="auto">
  <name>Task 2: Guardián de la checklist fuera del repositorio, G-04-2 en SOLUCION §10 y suite completa en verde</name>
  <files>tests/docs/readme.test.ts, tests/docs/solucion.test.ts</files>
  <action>
1. tests/docs/readme.test.ts: agregar un describe "checklist de entrega fuera del repositorio (D-99, decisión de la usuaria del 2026-10-16)" con constantes nuevas arriba del archivo: ENTREGA_RETIRADA ("docs/entrega.md"), NOMBRE_ENTREGA ("entrega.md"), GITIGNORE (".gitignore") y CARPETA_LOCAL (".local/"). Tres pruebas:
   - "docs/entrega.md ya no está en el repositorio", con el nombre armado desde ENTREGA_RETIRADA: leer(ENTREGA_RETIRADA) es la cadena vacía. leerDocumento ya devuelve vacío si el archivo no existe, así que no hace falta importar node:fs.
   - "ningún documento público enlaza ni nombra la checklist": arma la lista README, SOLUCION, cada documento de documentosMarkdown(RAIZ, CARPETA_DOCS) y README_MODULO; exige que tenga más de tres archivos (para que el escaneo no quede vacío) y que ninguno incluya NOMBRE_ENTREGA.
   - "la línea .local/ de .gitignore deja la copia local fuera del índice", con el nombre armado desde GITIGNORE y CARPETA_LOCAL: las líneas de .gitignore, recortadas, contienen CARPETA_LOCAL.
   El describe "enlaces y secretos de la documentación de entrega" sigue igual: el test.each con README, documentosMarkdown(RAIZ, CARPETA_DOCS) y README_MODULO conserva los escaneos de modelos retirados, asignaciones secretas y PII sobre todo docs/**.
2. tests/docs/solucion.test.ts: en MENCIONES[10] agregar "víspera", "`--guion`", "ENVIO-SIMULADO.md" y "turno 1". Así §10 conserva por prueba el aviso de los archivos de la corrida anterior y la programación del --guion que antes vigilaba la checklist (G-04-2). Ya están en §10 (viñetas de out/<caso>/ compartido y de operación de la defensa), así que la prueba pasa sin tocar SOLUCION.md.
3. Comprobar que el guardián detecta la violación, sin commitearla. Crear un archivo temporal docs/zz-control.md con una sola línea que enlace entrega.md y correr bun test tests/docs/readme.test.ts -t "fuera del repositorio": la prueba de menciones tiene que fallar y nombrar docs/zz-control.md. Borrar el archivo enseguida y anotar el resultado en el SUMMARY.
4. Formatear con bunx biome check --write sobre los dos archivos si hace falta. Correr bun run check (tsc del back y del front, más Biome) y la suite completa con bun test, una vez cada uno.
5. Commit con la identidad local y rutas explícitas (git add tests/docs/readme.test.ts tests/docs/solucion.test.ts). Mensaje: "test(quick-261016-ehz): vigila que la checklist de entrega no vuelva al repositorio y fija G-04-2 en SOLUCION §10". Termina con las líneas Co-Authored-By y Claude-Session indicadas.
6. En el SUMMARY, anotar:
   - D-99 queda enmendada por la usuaria el 2026-10-16: los pendientes humanos viven solo en .local/entrega.md;
   - el historial de git conserva las versiones anteriores de docs/entrega.md (riesgo aceptado T-261016-ehz-02);
   - la oración de rotación del código se conservó en SOLUCION.md §10 y en el README por D-94.
  </action>
  <verify>
    <automated>test ! -e docs/zz-control.md && bun test tests/docs/readme.test.ts -t "fuera del repositorio|G-04-2" && bun test tests/docs/solucion.test.ts && bun run check && bun test && git diff --quiet -- reto-01 && test -z "$(git ls-files .local docs/entrega.md)" && grep -q 'Código de acceso: `' README.md</automated>
    <fails_when>Falla si quedó el archivo de control en docs/; si el guardián de la checklist, el de G-04-2 o las menciones de §10 no pasan; si bun run check (tsc o Biome) o cualquier prueba de la suite completa falla, por ejemplo los escaneos de secretos y PII sobre docs/**; si reto-01/ cambió; si .local/ o docs/entrega.md están rastreados; o si el README perdió la línea del código de acceso (D-94).</fails_when>
  </verify>
  <done>
    - El guardián falla con un documento de control que nombra la checklist y pasa sin él (anotado en el SUMMARY).
    - SOLUCION.md §10 exige por prueba la víspera, el --guion, ENVIO-SIMULADO.md y el turno 1.
    - bun run check y bun test terminan con 0; reto-01/ intacto; el código de acceso sigue en el README.
    - Un segundo commit con la identidad local, solo con los dos archivos de prueba.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Máquina de la usuaria → repositorio remoto (GitHub, evaluadores invitados) | Lo que entra al índice queda visible para los evaluadores y en el historial; la copia local de la checklist no debe cruzar |
| Repositorio → imagen de Render | Render construye desde git con el Dockerfile, que copia rutas explícitas |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261016-ehz-01 | Information disclosure | .local/entrega.md (pendientes personales de la usuaria) | medium | mitigate | La línea .local/ en .gitignore (Task 1, paso 2), comprobada con git check-ignore y con test -z de git ls-files en ambos verify. Cada commit agrega rutas explícitas, nunca git add -A ni con punto. La prueba de .gitignore de la Task 2 impide quitar la regla sin que falle la suite |
| T-261016-ehz-02 | Information disclosure | historial de git (versiones anteriores de docs/entrega.md) | low | accept | La checklist no trae secretos: nombra la variable ACCESS_CODE sin valor, y el código ya está literal en el README por D-94. Reescribir el historial pediría un force-push sobre main, que Render despliega solo, y la usuaria no lo pidió. Queda en el SUMMARY para que lo decida ella |
| T-261016-ehz-03 | Information disclosure | README.md, SOLUCION.md, docs/**, modulo/README.md | low | mitigate | Los escaneos de modelos retirados, asignaciones secretas y PII siguen sobre README, documentosMarkdown(RAIZ, "docs") y modulo/README.md, más el de SOLUCION.md. La Task 2 corre la suite completa y el texto nuevo (la remisión a §10) no trae valores |
| T-261016-ehz-04 | Information disclosure | imagen Docker | low | accept | El Dockerfile copia solo src, agent, reto-01/fixtures, web y los manifiestos, así que .local/ nunca entra a la imagen. Render construye desde git, donde .local/ no existe |
| T-261016-ehz-SC | Tampering | npm/pip/cargo installs | high | accept | La tarea no instala paquetes ni toca package.json ni bun.lock |
</threat_model>

<verification>
- Task 1: la copia local es idéntica al blob 01b782a…, está ignorada y no rastreada; docs/entrega.md no existe; README, SOLUCION, docs/ y modulo/README.md no nombran entrega.md; bun test tests/docs pasa.
- Task 2: el guardián de la checklist y G-04-2 pasan (y el guardián falla con el control temporal); bun run check y bun test completos en verde; reto-01/ intacto; el código de acceso sigue en el README.
</verification>

<success_criteria>
Auditoría de cobertura de fuentes:

| Ítem | Fuente | Cubierto por |
|------|--------|--------------|
| Sacar docs/entrega.md del repositorio que ven los evaluadores | Descripción de la tarea (decisión de la usuaria, 2026-10-16) | Task 1, pasos 1-3 |
| Conservar una copia local ignorada por git (.local/entrega.md), con el contenido intacto | Descripción y restricciones | Task 1, pasos 1-2; verify por blob y git check-ignore |
| Quitar el enlace y la mención en README.md y SOLUCION.md | Descripción | Task 1, pasos 4-5 |
| Los pasos operativos útiles (pre-flight la víspera y --guion, modo por defecto 10 minutos antes) siguen en README y SOLUCION §10 | Descripción | Task 1, paso 6 (G-04-2 sobre el README); Task 2, paso 2 (§10) |
| Actualizar tests/docs/readme.test.ts y cualquier otro test o doc que lo exija o lo enlace (docs/estructura.md, arquitectura.md, convenciones.md, tests/docs/*.test.ts) | Descripción | Task 1, paso 6; los demás docs y tests no lo nombran (grep en el verify de la Task 1); Task 2, guardián de menciones sobre docs/** |
| Los escaneos de secretos y PII siguen cubriendo README, SOLUCION y docs/**, y el de documentosMarkdown pasa sin la checklist | Restricciones | Task 2 (describe de enlaces y secretos intacto, suite completa) |
| El código de acceso sigue en el README (D-94) | Restricciones / CONTEXT D-94 | Task 1, paso 4; verify de la Task 2 |
| No tocar reto-01/ | Restricciones / CLAUDE.md | verify de la Task 2 |
| D-99 (pendientes humanos documentados) queda enmendada por la usuaria | CONTEXT D-99 | Task 2, paso 6 (registro en el SUMMARY) |
| DOC-01 (README) y DOC-02 (SOLUCION.md) siguen cumplidos | REQ | Task 1 y Task 2 (readme.test.ts y solucion.test.ts en verde) |
| bun run check y bun test en verde | Descripción | Task 2, paso 4 |
| RESEARCH | no hay (tarea rápida sin investigación) | — |

Medible: docs/entrega.md fuera del índice y del árbol, la copia local idéntica e ignorada, ninguna mención pública, G-04-2 vigilado en el README y en SOLUCION §10, bun run check y bun test con 0, reto-01/ intacto, y dos commits con la identidad local y los trailers indicados.
</success_criteria>

<output>
Crear `.planning/quick/261016-ehz-sacar-docs-entrega-md-del-repo-con-copia/261016-ehz-SUMMARY.md` al terminar. Debe incluir:
- el resultado de la comprobación con el documento de control de la Task 2;
- la enmienda de D-99 (los pendientes humanos viven solo en .local/entrega.md);
- el riesgo aceptado del historial de git (T-261016-ehz-02);
- que la oración de rotación del código se conservó en SOLUCION.md §10 y en el README por D-94.
</output>
