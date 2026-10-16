# Phase 4: Módulo, documentación y defensa - Context

**Gathered:** 2026-10-15
**Status:** Ready for planning

<domain>
## Phase Boundary

La fase entrega lo que falta para evaluar y defender el reto, sin capacidades nuevas en el agente:

- el bonus `modulo/` como **fuente única** de las piezas que usa la app (MOD-01, MOD-02);
- `README.md` (DOC-01) y `SOLUCION.md` con las 10 secciones del PRD §9.1 (DOC-02);
- la documentación de continuidad `docs/arquitectura.md` y `docs/convenciones.md` (CAL-05);
- la CI en GitHub Actions con badge (DEMO-05);
- un script de pre-flight y el ensayo del guion §11 sobre el link público (DEP-03).

Queda fuera de la fase cambiar la conducta del agente, de la API o de la SPA. La única excepción es lo que exija encadenar el deploy a la CI (`render.yaml`). "Procesar sin el modelo" (G-03-15 opción A) sigue diferido.

La numeración de decisiones sigue la de la Fase 3 (D-01 a D-78).

</domain>

<decisions>
## Implementation Decisions

### modulo/ como fuente única (MOD-01, MOD-02)
- **D-79:** El cuerpo de `modulo/agent.md` es **idéntico byte a byte** a `agent/prompt.md`, sin párrafos agregados. Solo se le antepone el frontmatter del PRD §9.4: `description`, `mode: primary` y `permission { edit: deny, bash: deny }`. Del mismo modo, el cuerpo de `modulo/skill/registro-proveedor/SKILL.md` es idéntico a `src/knowledge/registro-proveedor.md`, con frontmatter `name` y `description`. Motivo: el §9.4 evalúa que las piezas sean "las mismas que usa tu aplicación (no copias divergentes)", y cualquier añadido se leería como divergencia.
- **D-80:** Fuera del servidor (OpenCode) nadie formula la pregunta de confirmación al cierre del turno, porque desde 02-18 la escribe el servidor y `prompt.md` ya no la pide. Se **acepta y se documenta** en `SOLUCION.md` (riesgos o supuestos) y en un `modulo/README.md` corto. La red de seguridad sigue en pie: el conocimiento dice que `proveedor_simular_envio` solo se usa tras una confirmación explícita, y la herramienta exige `confirmado: true`. Resuelve el bloqueante de STATE.md "[Phase 4] modulo/agent.md… quién pide la confirmación".
- **D-81:** `modulo/tools/proveedor.ts` **re-exporta** las herramientas de `src/tools/proveedor.ts` con el alias `@/`, sin copias ni bundle. El módulo funciona cuando el host (OpenCode u otro) se abre en la raíz del repo: las herramientas ya resuelven fixtures y `out/` desde `ctx.directory` y aceptan `sessionID`. El test de **identidad de referencia** comprueba que cada export de `modulo/` es `===` al de la app. No hay `bun build` a `dist/`.
- **D-82:** `agent.md` y `SKILL.md` se **generan con un script y se commitean**, para que el evaluador vea `modulo/` completo sin correr nada. Un test de **igualdad byte a byte** compara los archivos commiteados con la salida del generador, así que si alguien edita `prompt.md` o el conocimiento sin regenerar, la CI falla. También hay un test de **importación sin env** de `modulo/tools/proveedor.ts`. Los textos del frontmatter (`description`) salen de `src/config/strings.ts` o de constantes, según las reglas del repo.
- **D-83:** Se agrega un **`opencode.json` en la raíz** que registra el agente, las herramientas y la skill desde `modulo/`, como evidencia tangible de la integración. **No** se instala OpenCode ni se ensaya en vivo, porque el PRD no lo exige. El investigador verifica el formato vigente de OpenCode: frontmatter del agente, forma `{ description, args, execute }` de la herramienta, nombre `<archivo>_<export>`, frontmatter de la skill, campo `sessionID` del contexto y esquema de `opencode.json`.

### SOLUCION.md (DOC-02)
- **D-84:** Es **conciso y enlaza**: cada sección cabe en una pantalla y el detalle vive en `docs/` (límites del demo, arquitectura, convenciones). Tiene que poder leerse en unos 10 minutos antes de la defensa. Está en español y respeta las 10 secciones en el orden del §9.1.
- **D-85:** El diagrama de arquitectura (§2) va en **Mermaid**: front → backend (bucle, adaptador LLM, compuerta) → herramientas → `fixtures/` y `out/`, y dónde viven el prompt, el conocimiento y la ejecución.
- **D-86:** El costo por caso (§4) sale de una **corrida medida nueva**. Un script corre en vivo contra DeepSeek los 4 casos y el guion §11 una vez, toma `prompt_cache_hit_tokens`, `prompt_cache_miss_tokens` y `completion_tokens` del `usage` registrado, y arma la tabla con los precios vigentes de `deepseek-flash`. La corrida es reproducible y su evidencia queda en el repo, sin PII ni claves. Se puede reutilizar la infraestructura de `test:vivo` (`tests/live`).
- **D-87:** "Uso de IA" (§9): **Claude Code con el flujo GSD**. La sección destaca los **agentes y wrappers propios**: `eli-qa-sdd-gsd` (un runner de QA que envuelve `verify-work` con suites reproducibles, recetas CLI, HTTP, SSE y navegador con Playwright, escaneo de PII y determinismo) y `eli-qa-map-repos` (el manifiesto de topología). Explica **cómo se adaptó el flujo hacia la calidad**: guardianes de arquitectura G1–G16 y W1–W13, el test sin comentarios, code review, auditoría de seguridad (87/87), UAT con evidencia y cierres de brechas. Lo descartado se redacta desde `.planning/`: LangChain y el AI SDK, el SDK `openai`, SheetJS, Tailwind y `react-markdown`, la gramática de rechazo por texto (D-63.11) y el ciclo de parches del limitador. La usuaria revisa el texto final.
- **D-88:** `SOLUCION.md` recoge lo que STATE.md y las fases anteriores dejaron pendiente:
  - los límites del demo (pendiente incorporado; ver Folded Todos);
  - AR-02-06 y D-63.11;
  - WR-03 y los ids canónicos de la demo;
  - la nota de NOMBRE_SOPORTE (IN-01), que se mueve desde `docs/plantillas.md`;
  - el estado de SEG-02;
  - T-02-41;
  - la cookie HttpOnly firmada, elegida por buenas prácticas;
  - D-09 (para qué sirve el LLM si el núcleo es determinista) como trade-off;
  - `demo.ts` como verificación sin modelo (D-70);
  - los seguimientos menores de la QA de la Fase 3;
  - la rúbrica ausente del §10 como supuesto en §7, junto con la fecha de ejecución y el envío con bloqueos;
  - la justificación de cada dependencia (PRD §8);
  - D-80 como límite del módulo.

### CI, badge y repo (DEMO-05)
- **D-89:** La entrega es el **repo privado con los evaluadores invitados** como colaboradores. Así ven el badge y el README con el código de acceso, y el código no queda público.
- **D-90:** La CI de GitHub Actions corre `bun run check` (tsc del backend y de la web, más Biome), `bun test` (incluidos los guardianes), `bun run demo.ts` y `build:web`, con `bun install --frozen-lockfile` y la versión de Bun de `.bun-version`. **`bun audit` va en un job aparte que no bloquea el badge**, para que un aviso nuevo de terceros la víspera de la defensa no lo pinte de rojo. El job principal no debe incluir el audit, aunque hoy `bun run check` sí lo incluye: el planner decide cómo separarlo (por ejemplo, un script `check` sin audit más `audit` aparte). El badge va arriba en el README.
- **D-91:** **Render despliega solo si pasa la CI**: `render.yaml` cambia `autoDeploy: true` por el disparador por checks (`autoDeployTrigger: checksPass`, a verificar por el investigador). Hay que actualizar `tests/despliegue/contrato-despliegue.test.ts` si aserta sobre `autoDeploy`. — **Reversibility:** reversible — es un campo del blueprint.

### Pre-flight y defensa (DEP-03)
- **D-92:** El pre-flight es un script de Bun contra el link público:
  - **Por defecto**, sin gastar tokens: despierta el servicio, espera `/api/health`, comprueba el código de acceso y el handshake SSE (ping o encabezados sin buffering).
  - **Con `--guion`**: corre el §11 completo en dos turnos. Primero "Procesa el caso ec-corp-andina… No envíes nada todavía" y verifica `needsConfirmation` y los bloqueos. Después "envía" y verifica que exista `ENVIO-SIMULADO.md`. Reporta los tokens usados.
  - El código de acceso y la URL se leen de env o de argumentos, nunca hardcodeados.
- **D-93:** Para mantener despierto Render basta lo simple: correr el pre-flight unos 10 minutos antes de la defensa, porque la propia defensa genera tráfico. **No** se configura un cron externo; el README solo lo menciona como opción.
- **D-94:** El **código de acceso va literal en el README**, como pide el §9.2. Solo lo ven los invitados (D-89) y se rota después de la evaluación (es la env var `ACCESS_CODE` de Render, `sync: false`). El README advierte que el valor tiene que coincidir con el de Render.
- **D-95:** El ensayo del §11 sobre el link público (criterio 5) lo hace **eli-qa con Playwright**: una prueba de la suite de la Fase 4 en el navegador sobre Render, con capturas como evidencia. **Después la usuaria lo ensaya una vez a mano**, como en la defensa.

### Claude's Discretion
- La estructura y el orden del `README.md`: badge, link y código, un comando, env vars desde `.env.example`, `demo.ts`, tests, pre-flight y `modulo/`.
- Si `docs/arquitectura.md` absorbe, resume o enlaza `docs/estructura.md`, y cómo `docs/convenciones.md` se deriva de las reglas de `.claude/CLAUDE.md` sin duplicarlas a mano.
- Qué trade-offs entran en §6 (mínimo 3, cada uno con la alternativa descartada). Candidatos: el LLM solo orquesta (D-09); un bucle propio en vez de un framework; la compuerta decidida por el servidor en vez del modelo; la minimización de PII hacia el LLM; SSE en vez de WebSockets; Render free con Dockerfile como plan B; la cookie HttpOnly.
- Dónde viven el script generador de `modulo/`, el de costo y el de pre-flight, y cómo se nombran sus comandos en `package.json`, siempre que respeten los guardianes de layout (G13 y similares). Si una regla nueva lo exige, se actualizan en la misma tarea `.claude/CLAUDE.md` y los guardianes (precedente D-62).
- La redacción exacta del frontmatter `description` de `agent.md` y `SKILL.md`.

### Folded Todos
- **Llevar a SOLUCION.md los límites del demo (estado en memoria y disco efímero)** (`.planning/todos/pending/2026-10-15-solucion-limites-del-demo.md`). La sección de riesgos (§10) de SOLUCION.md explica tres cosas, basadas en `docs/limites-del-demo.md`: qué se pierde al reiniciar o redesplegar, o cuando Render duerme el servicio (tope diario, limitadores por IP, cupos de turno, sesiones nuevas, sesiones y `out/`); por qué se acepta en el reto; y qué haría un despliegue real (Redis o una base de datos, alertas de gasto, una instancia siempre activa o varias con estado compartido, almacenamiento de objetos para `out/`). Al cerrar la fase se marca como resuelto.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Especificación del reto (vinculante, no modificar)
- `reto-01/PRD.md` §9.1: las 10 secciones obligatorias de SOLUCION.md.
- `reto-01/PRD.md` §9.2: el contenido del README (un comando, env vars, demo, link y código de acceso).
- `reto-01/PRD.md` §9.4: la estructura y el frontmatter de `modulo/`, y "las mismas piezas que usa tu aplicación".
- `reto-01/PRD.md` §9.5: la forma de entrega (sin `node_modules/`, `out/` ni `.env`).
- `reto-01/PRD.md` §7.4: el diseño del portal web, que va en SOLUCION.md §5.
- `reto-01/PRD.md` §8: los requisitos no funcionales (arranque en menos de 2 min y dependencias justificadas).
- `reto-01/PRD.md` §10: los riesgos y supuestos del PRD.
- `reto-01/PRD.md` §11: el guion de la defensa, que comprueba el pre-flight `--guion` y el ensayo.
- `reto-01/PRD.md` §6.1–6.5: los componentes, el contrato de herramientas y la API, como base de §2 y §3 de SOLUCION.md.

### Planeación del proyecto
- `.planning/REQUIREMENTS.md`: MOD-01, MOD-02, DOC-01, DOC-02, DEP-03, DEMO-05 y CAL-05.
- `.planning/ROADMAP.md` §Phase 4: los criterios de éxito y el flag de investigación de OpenCode.
- `.planning/PROJECT.md`: Key Decisions, la fuente de los trade-offs y del uso de IA.
- `.planning/STATE.md`, §Blockers/Concerns y §Decisions: lo que SOLUCION.md debe recoger.
- `.planning/todos/pending/2026-10-15-solucion-limites-del-demo.md`: el pendiente incorporado.
- `.planning/phases/01-n-cleo-determinista/01-CONTEXT.md`: D-09 (rol del LLM), D-28 (reglas como datos), D-30/D-35 (dependencias y política de madurez) y las rutas canónicas para `modulo/`.
- `.planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md`: D-37 a D-44 y D-63.x (compuerta y confirmación), D-55 (prompt frente a conocimiento) y D-59 (adaptador).
- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-CONTEXT.md`: D-70 (demo.ts como verificación sin modelo), la cookie HttpOnly y D-73.6 (estado en memoria).
- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-SECURITY.md`: 87/87 amenazas, como evidencia para SOLUCION.md.
- `.planning/research/STACK.md`, `ARCHITECTURE.md` y `PITFALLS.md` (si existen): la justificación de las dependencias y las alternativas descartadas.

### Fuentes de modulo/
- `agent/prompt.md`: el cuerpo de `modulo/agent.md`, byte a byte.
- `src/knowledge/registro-proveedor.md`: el cuerpo de `modulo/skill/registro-proveedor/SKILL.md`, byte a byte.
- `src/tools/proveedor.ts`: lo que re-exporta `modulo/tools/proveedor.ts`.
- `src/tools/factories/definir-herramienta.factory.ts`: la forma de cada herramienta y la normalización de `sessionId`/`sessionID`.
- `src/config/env.ts` (`readToolEnv`): la lectura perezosa del env que permite importar sin env.
- `tests/contract/instrucciones-agente.test.ts`: el patrón existente para leer el prompt y el conocimiento desde las constantes.

### Documentación existente
- `docs/limites-del-demo.md`: la base de la sección de riesgos y de trabajo futuro.
- `docs/estructura.md`: la estructura de `src/`, punto de partida de `docs/arquitectura.md`.
- `docs/plantillas.md`: la nota de NOMBRE_SOPORTE (IN-01), que pasa a SOLUCION.md.
- `.claude/CLAUDE.md` §Reglas de código del proyecto: la fuente de `docs/convenciones.md`.

### Despliegue y CI
- `render.yaml`: el blueprint (`autoDeploy`, env vars, `ACCESS_CODE` con `sync: false`).
- `tests/despliegue/contrato-despliegue.test.ts`: el contrato del blueprint, a actualizar si cambia `autoDeploy`.
- `package.json` (scripts `check`, `test`, `demo`, `build:web`, `audit` y `test:vivo`) y `.bun-version`.
- `.env.example`: la fuente de la tabla de variables del README.
- `Dockerfile`: el plan B portable, que se menciona en el README y en SOLUCION.md.

### Uso de IA (§9 de SOLUCION.md)
- `.claude/skills/eli-qa-sdd-gsd/SKILL.md` y `.agents/commands/eli-qa-sdd-gsd.md`: el runner de QA propio que envuelve `verify-work`.
- `.claude/skills/eli-qa-map-repos/SKILL.md` y `.agents/commands/eli-qa-map-repos.md`: el mapeo de la topología de QA.
- `.qa/qa-topology.json`, `.qa/suites/` y `.qa/evidence/`: las suites reproducibles y la evidencia por fase.
- `tests/architecture.test.ts`, `tests/arquitectura-web.test.ts` y `tests/sin-comentarios.test.ts`: los guardianes como mecanismo de calidad.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/tools/proveedor.ts`: ya exporta `leer_solicitud`, `mapear_campos`, `generar_formulario`, `armar_paquete` y `simular_envio` desde `crearHerramientas()`, sin servidor. Es lo que re-exporta `modulo/`.
- `ARCHIVO_PROMPT`, `DIRECTORIO_AGENTE` y `ARCHIVO_CONOCIMIENTO_PROCESO` en `src/config/constants/files.constants.ts`: las rutas fuente del generador, que no deben repetirse como literales.
- `tests/live` y `bun run test:vivo` (`LLM_EN_VIVO=1`): la base para la corrida medida de costo (D-86).
- `tests/helpers/correr-demo.helper.ts`: el patrón para correr `demo.ts` desde los tests y la CI.
- Los logs pino con `usage` por llamada y `out/log.jsonl`: la fuente de los tokens para la tabla de costo.
- La suite de eli-qa (`.qa/suites/03.suite.json`, recetas de Playwright sobre Render de T18 y T21): base para el ensayo del §11 de la Fase 4.

### Established Patterns
- Cada regla de forma tiene guardián (G1–G16, W1–W13 y sin comentarios). Los scripts nuevos (generador, costo, pre-flight) y `modulo/` tienen que encajar en el layout o actualizar el guardián y `.claude/CLAUDE.md` en la misma tarea (D-62).
- Imports solo con alias `@/` y `@tests/`, nunca `../`. `modulo/tools/proveedor.ts` usa `@/tools/proveedor.ts`.
- Todos los textos van en `src/config/strings.ts` y las constantes en `config/constants/`. El frontmatter generado sigue esta regla.
- Las docs van en español y sin comentarios en el código: la explicación va en `docs/`, en el README o en SOLUCION.md.
- Política de madurez de 7 días para cualquier versión nueva (D-35), aplicable a las actions de la CI (fijadas por versión o SHA).

### Integration Points
- `package.json`: scripts nuevos (`modulo`, `preflight`, `costo` o los nombres que elija el planner) y la separación de `check` y `audit` para la CI (D-90).
- `render.yaml`: el disparador del deploy por checks (D-91).
- `.github/workflows/ci.yml` (nuevo): el job principal más el job de audit no bloqueante.
- `opencode.json` (nuevo, en la raíz): registra `modulo/` (D-83).

</code_context>

<specifics>
## Specific Ideas

- La usuaria quiere que "Uso de IA" muestre **lo clave de los agentes personalizados y los wrappers especializados y potentes, como eli-qa**, y **cómo se adaptó el flujo de trabajo hacia la calidad**. No basta con listar herramientas: hay que contar el método.
- Ante cada decisión dudosa del módulo, la usuaria pidió lo que **mejor cumpla los requisitos del reto**. El criterio rector de la fase es la letra del PRD y la rúbrica, no la sofisticación.
- Mantener despierto Render no merece esfuerzo extra ("es prueba de reto"): basta la opción más simple que funcione.

</specifics>

<deferred>
## Deferred Ideas

- **Procesar sin el modelo** (G-03-15 opción A, viene de la Fase 3): sigue diferido. Si se quisiera antes de la defensa, sería una fase 3.1 aparte, porque revierte D-70.
- **Bundle portable de `modulo/`** con `bun build` a `dist/`, para usarlo fuera de este repo: descartado por ahora (D-81). Queda como trabajo futuro en SOLUCION.md.
- **Ensayo en vivo con OpenCode**: no se hace (D-83). Solo se agrega `opencode.json` y se verifica el formato.
- **Cron externo para calentar Render** (cron-job.org o UptimeRobot): solo se documenta como opción (D-93).
- Siguen diferidos desde las fases 2 y 3: revelar el valor real en la UI por un canal aparte del modelo, y cambiar de proveedor o de modelo desde la UI.

</deferred>

---

*Phase: 04-módulo-documentación-y-defensa*
*Context gathered: 2026-10-15*
