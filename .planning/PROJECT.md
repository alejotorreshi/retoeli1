# Agente "Registro como Proveedor" (Reto 01 · Perxia 2.0)

## What This Is

Agente conversacional completo e independiente que automatiza el llenado de formularios de registro como proveedor de Periferia IT Group ante sus clientes (CO, EC, PE, PA, HN). La analista administrativa conversa en un chat web ("procesa el caso X"). El agente lee la solicitud, mapea cada campo contra el repositorio maestro y genera el formulario en el formato pedido (xlsx, pdf o valores para portal). Después arma el paquete para firma con checklist y borrador de correo, y pide confirmación humana explícita antes de cualquier "envío". Es la entrega de un reto técnico de selección. Lo evalúa una rúbrica de 100 puntos (aprobación con 70, más un bonus de hasta 10), y la especificación fuente es `reto-01/PRD.md`.

## Core Value

El agente **nunca inventa un dato**. Cada valor de un formulario sale de una herramienta tipada que lo lee del maestro; lo que no existe queda como `faltante` y lo dudoso como `requiere_confirmacion`. Ninguna acción externa ocurre sin confirmación humana explícita.

## Business Context

- **Customer**: Equipo Perxia 2.0 de Periferia IT Group (evaluadores del reto). La usuaria simulada es la analista administrativa.
- **Revenue model**: N/A: es una entrega de proceso de selección.
- **Success metric**: Puntaje de la rúbrica del PRD (sección 10): ≥ 70/100 y la meta es el máximo, con el bonus `modulo/` (+10). También se evalúa una defensa en vivo con link público activo.
- **Strategy notes**: `reto-01/PRD.md` es la fuente de verdad del alcance.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Herramientas tipadas con zod en `src/tools/proveedor.ts`, con el contrato exacto del PRD: `proveedor_leer_solicitud`, `proveedor_mapear_campos`, `proveedor_generar_formulario`, `proveedor_armar_paquete` y `proveedor_simular_envio`. Devuelven string JSON `{ ok, data }` o `{ ok: false, error }` y nunca lanzan.
- [ ] HU-1: leer la solicitud (país, cliente, formato, campos y soportes) y reportar campos ambiguos como `requiere_confirmacion` con el equivalente tributario del país.
- [ ] HU-2: mapear campos al maestro con tres estados (`lleno` con ruta, `faltante`, `requiere_confirmacion` si confianza < 0.8 o aplica una regla de país). Los sinónimos del glosario se resuelven automáticamente.
- [ ] HU-3: generar el formulario. P0 xlsx en la hoja y celda exactas de `plantilla-celdas.json`. P1 PDF generado con etiqueta y valor en orden. P2 portal: `formato no soportado` más `valores-portal.md`.
- [ ] HU-4: armar el paquete en `out/<caso>/paquete/` con el formulario, copias de los soportes, `checklist.md` (presentes, ausentes y vencidos) y `borrador-correo.md`. Los soportes vencidos o ausentes bloquean `listo_para_firma`.
- [ ] HU-5: manejo de errores claro sin trazas crudas. Un caso malo no impide los demás y la sesión no muere.
- [ ] Reglas de negocio RN1 a RN5 del PRD: identificador tributario por país, datos bancarios nunca en el correo, bloqueo por soportes, confirmación antes de acciones externas y `out/<caso>/log.jsonl`.
- [ ] Ciclo del agente con reglas CA1 a CA5: tope de iteraciones (25), sin valores fuera de herramientas, confirmación humana, tool calls visibles y registradas en `out/log.jsonl`, y errores mostrados en lenguaje claro.
- [ ] Adaptador LLM propio `enviar(mensajes, herramientas) → respuesta`, con implementación DeepSeek. Cambiar de proveedor no toca el ciclo.
- [ ] Front de chat en React + Vite: historial, indicador de "pensando", cada tool call visible (nombre, args y resultado resumido) y resaltado del estado de confirmación. Usa streaming SSE.
- [ ] API documentada: `POST /api/chat` (stream SSE), `GET /api/sessions/:id` y `GET /api/health` (`{ ok, provider, model }` sin claves).
- [ ] System prompt en `agent/prompt.md` y conocimiento del proceso en `src/knowledge/registro-proveedor.md`, separados de la ejecución en `src/tools/`.
- [ ] `demo.ts` ejecuta los 4 casos llamando directamente a las herramientas, sin clave LLM y de forma determinista. Limpia `out/` al inicio.
- [ ] Protección de PII: redacción en logs, API y resúmenes de tool calls, más minimización hacia el LLM (el modelo ve rutas y valores enmascarados; las herramientas escriben el valor real solo en los archivos de salida).
- [ ] Seguridad y costo: la clave de DeepSeek solo vive en una env var del backend, el link público lleva código de acceso, y hay rate limit, tope de tokens por sesión y timeout al proveedor.
- [ ] Observabilidad y resiliencia: logs estructurados JSON con correlación sesión/turno/tool, timeouts, reintentos con backoff ante errores transitorios del LLM y degradación elegante.
- [ ] Bonus `modulo/`: `agent.md`, `tools/proveedor.ts` y `skill/registro-proveedor/SKILL.md` como la **misma fuente** que consume la app (generados o enlazados, no copias divergentes).
- [ ] Despliegue público en Render (free) con Dockerfile portable como plan B, y `.env.example` sin valores.
- [ ] Tests: unitarios de dominio (mapeo, reglas de país, vigencias), contrato de herramientas, ciclo del agente con LLM falso y `demo.ts` como e2e determinista.
- [ ] Documentación: `README.md` (un comando para levantar, env vars, demo, link y clave de acceso) y `SOLUCION.md` con las 10 secciones obligatorias del PRD, incluido el diseño del portal web y el uso de IA.

### Out of Scope

- Integración real con correo, SharePoint, firma electrónica o portales de clientes: es un no-objetivo del PRD y una decisión humana.
- Automatización real de portales web: se diseña en `SOLUCION.md` y no se implementa (P2).
- Autenticación de usuarios, roles o multiusuario: no-objetivo del PRD. Solo hay un código de acceso compartido para proteger el saldo del LLM.
- Base de datos: no-objetivo del PRD. Las sesiones viven en memoria o archivo y las salidas en `out/`.
- Rellenar un AcroForm PDF real: el PRD acepta un PDF generado.
- Modificar `reto-01/PRD.md` o los fixtures: los entregó Periferia y no se tocan.

## Context

- **Origen**: reto técnico 01 del proceso de selección del equipo Perxia 2.0 (Periferia IT Group), PRD v2.0 del 2026-09-03. Se permite usar IA para construir, siempre que se declare en `SOLUCION.md`, y la autora debe poder explicar cada línea.
- **Fixtures** (en `reto-01/fixtures/reto-01/`, solo lectura):
  - `co-industrias-delta`: CO, xlsx (`plantilla-celdas.json`). Exige cámara de comercio, RUT, certificación bancaria y estados financieros.
  - `ec-corp-andina`: EC, pdf (`plantilla-campos.json`). Exige además `certificado_cumplimiento_tributario`, que **no existe** en el repositorio (ausente → bloquea).
  - `hn-agroexport-sula`: HN, xlsx. Exige cámara de comercio, RUT y parafiscales (este último venció el 2026-08-31).
  - `pa-logistica-istmo`: PA, portal (P2 → `valores-portal.md`).
  - `repositorio/maestro.json`: datos ficticios de Periferia en snake_case con objetos anidados (`representante_legal.*`, `contacto_comercial.*`, `ingresos_ultimo_ano.*`, banco/cuenta).
  - `repositorio/soportes/index.json`: soportes con `vigencia_hasta`. `camara_comercio` vence el 2026-09-30 y `parafiscales` el 2026-08-31, así que según la fecha de ejecución pueden estar vencidos.
  - `glosario-campos.json`: etiqueta del cliente → clave del maestro (incluye NIT, RUC y RTN → `nit`).
- **Determinismo**: la vigencia depende de la "fecha de ejecución". El reloj se inyecta (y es configurable) para que `demo.ts` y los tests sean reproducibles.
- **LLM**: DeepSeek, con API compatible con OpenAI y function calling. La clave es de la usuaria y es prepaga, así que un saldo bajo limita la exposición.
- **Calidad esperada por la usuaria**: arquitectura limpia y escalable, siguiendo SOLID y Clean Architecture. Que cualquier dev o IA pueda continuarla. Constantes separadas y centralizadas, contratos claros, funciones y documentos pequeños, observabilidad, fallback, resiliencia, protección de PII, tokens y seguridad. Las prácticas se van mejorando sobre la marcha.
- **Evaluación**: se evalúa la separación entre comportamiento (`agent/prompt.md`), conocimiento (`src/knowledge/`) y ejecución (`src/tools/`). Un cambio de reglas de negocio no debe tocar el servidor.

## Constraints

- **Tech stack**: TypeScript estricto sin `any`, Bun como runtime, zod obligatorio para los args de herramientas, React + Vite en el front. Así lo exige el PRD (Bun o Node 20+, zod) y lo eligió la usuaria.
- **Repo layout**: el código vive en la raíz `reto-eli-1/` (`src/`, `web/`, `agent/`, `demo.ts`, `package.json`, `modulo/`) y `reto-01/` queda intacto con el PRD y los fixtures. La ruta a los fixtures es una constante de configuración. Es una decisión de la usuaria.
- **Contrato de herramientas**: el nombre visible para el modelo es `<archivo>_<export>`. La firma es `execute(args, ctx: { directory, sessionId }) → string`, y las rutas se resuelven desde `ctx.directory`, nunca como absolutas. Lo exige el PRD (sección 6.2).
- **Seguridad**: la clave solo existe en una env var del backend. Nunca en el repo, el front, los logs ni las respuestas de la API. Las herramientas no ejecutan shell. No se usan datos reales. Lo exige el PRD (sección 8).
- **Costo**: tope de iteraciones por turno y tope de tokens por sesión, ambos configurables, porque el link es público y la clave es personal.
- **Arranque**: un comando (`bun run dev`) levanta front y backend en menos de 2 minutos en una máquina limpia. Lo exige el PRD (sección 8).
- **Entrega**: repositorio Git con historial. Sin `node_modules/`, `out/` ni `.env`. Los commits van con la identidad git local `elianatorres5772 <elianatorres5772@gmail.com>`.
- **Timeline**: de 1 a 2 días.
- **Deploy**: Render free (el servicio duerme por inactividad, así que hay que calentarlo antes de la defensa, y el disco es efímero). Desplegar solo en local penaliza con -10.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DeepSeek como proveedor LLM detrás de un adaptador propio | Elección de la usuaria. Es compatible con OpenAI y económico, y el adaptador permite cambiarlo sin tocar el ciclo | — Pending |
| Bun como runtime | El PRD usa `bun run demo.ts`. Trae TS nativo y test runner incluido | — Pending |
| React + Vite con SSE streaming | Hace visible en vivo cada tool call, el texto y el estado de confirmación. Mejor UX y observabilidad | — Pending |
| Minimizar la PII hacia el LLM (rutas y valores enmascarados; las herramientas escriben los valores reales) | Máxima protección de datos. Refuerza CA2: el modelo no puede afirmar valores que no vio | — Pending |
| Render free con código de acceso, más Dockerfile portable como plan B | Opción gratuita con secrets en el panel. Docker permite migrar a Koyeb, HF o Fly | — Pending |
| Bonus `modulo/` diseñado desde el inicio como fuente única | +10 puntos. Obliga a separar bien prompt, conocimiento y herramientas | — Pending |
| Código en la raíz del repo y `reto-01/` intacto | Decisión de la usuaria. Los fixtures no se modifican | — Pending |
| Identificadores de dominio en español y de infraestructura en inglés; docs en español | Respeta el contrato del PRD y mantiene un vocabulario técnico estándar | — Pending |
| Reloj inyectable para las vigencias | Determinismo de `demo.ts` y de los tests | — Pending |
| Tests: unitarios + contrato + ciclo con LLM falso + demo e2e | Calidad verificable sin gastar tokens | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-12 after initialization*
