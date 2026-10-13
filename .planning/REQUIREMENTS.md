# Requirements: Agente "Registro como Proveedor" (Reto 01 · Perxia 2.0)

**Defined:** 2026-10-12
**Core Value:** El agente nunca inventa un dato. Cada valor de un formulario sale de una herramienta tipada que lo lee del maestro; lo que no existe queda como `faltante` y lo dudoso como `requiere_confirmacion`. Ninguna acción externa ocurre sin confirmación humana explícita.

Fuente vinculante: `reto-01/PRD.md`, sin modificar. Fixtures: `reto-01/fixtures/reto-01/`, de solo lectura.

## v1 Requirements

### Herramientas y contrato (§6.2)

- [x] **HERR-01**: `src/tools/proveedor.ts` exporta exactamente 5 herramientas (`leer_solicitud`, `mapear_campos`, `generar_formulario`, `armar_paquete`, `simular_envio`). El modelo ve cada una como `proveedor_<export>`, con una `description` de una frase.
- [x] **HERR-02**: Cada herramienta declara sus `args` como esquemas zod con `.describe()` en cada campo. El backend valida antes de ejecutar y, si los args no cumplen, devuelve el error al modelo.
- [x] **HERR-03**: `execute(args, ctx)` devuelve siempre un string JSON con `{ ok: true, data }` o `{ ok: false, error }`, y nunca lanza hacia el agente. Los códigos de error son estables y los mensajes van en español, sin traza cruda.
- [x] **HERR-04**: Las herramientas resuelven rutas desde `ctx.directory`, nunca como absolutas. Validan `caso` contra path traversal y nunca ejecutan comandos de shell.
- [x] **HERR-05**: Las herramientas se importan sin el servidor ni secretos, y las reutilizan `demo.ts` y `modulo/`. El contexto acepta `sessionId` o `sessionID`.

### Lectura de la solicitud (HU-1)

- [x] **SOLI-01**: `leer_solicitud` devuelve `{ pais, cliente, formato: xlsx|pdf|portal, campos[], soportes[] }`. La plantilla se elige según el archivo presente (`plantilla-celdas.json` o `plantilla-campos.json`), no solo por el formato.
- [x] **SOLI-02**: Las etiquetas ambiguas (por ejemplo "Identificación tributaria") se reportan como `requiere_confirmacion` y se propone el equivalente del país: NIT para CO, RUC para EC, PE y PA, RTN para HN.
- [ ] **SOLI-03**: El cuerpo del correo del cliente no se expone al modelo; todo dato de fixture se trata como no confiable y el prompt lo declara; un test con un fixture inyectado lo verifica.

### Mapeo al maestro (HU-2, RN1)

- [x] **MAP-01**: Cada campo solicitado termina en un estado: `lleno` (con la `ruta` del dato en el maestro), `faltante` (sin fuente) o `requiere_confirmacion` (confianza < 0.8 o regla de país).
- [x] **MAP-02**: Los sinónimos se resuelven solo por el glosario, con normalización (minúsculas, sin tildes, trim, sin `:` ni `*` finales). No hay fuzzy matching ni mapeo hecho por el LLM. Un campo sin fuente es `faltante` y nunca recibe un valor inventado: "Número de contribuyente especial" y "Referencias comerciales" quedan como `faltante`.
- [x] **MAP-03**: Se aplica RN1. Para CO, el NIT queda `lleno`. Para EC, PE, PA y HN, el campo se llena con el NIT, queda `requiere_confirmacion` y lleva la nota "identificador extranjero".
- [x] **MAP-04**: Se leen rutas anidadas del maestro (`representante_legal.nombre`, `ingresos_ultimo_ano.valor`, datos bancarios). Una ruta inexistente da `faltante`.
- [x] **MAP-05**: El LLM nunca recibe valores reales. Las herramientas le devuelven `{ etiqueta, ruta, estado, confianza, valor_enmascarado }`.
- [x] **MAP-06**: Cada valor queda trazado con `ruta`, `regla` (glosario exacto, glosario normalizado, clave directa o regla de país) y `confianza`. Todo se persiste en `out/<caso>/mapeo.json`.
- [x] **MAP-07**: Los valores compuestos llevan notas de contexto. Por ejemplo, "Ingresos anuales" va con moneda y año para clientes no-CO, y "País" con su nota.

### Generación del formulario (HU-3)

- [x] **FORM-01**: Para P0 se genera `out/<caso>/formulario.xlsx`, con cada etiqueta en `celda_etiqueta` y su valor en `celda_valor`, en la hoja indicada (hay soporte para varias hojas). Los valores se escriben como texto para preservar los ceros a la izquierda.
- [x] **FORM-02**: Para P1 se genera `out/<caso>/formulario.pdf` con todas las etiquetas y valores en el orden de `plantilla-campos.json`. Los campos `faltante` y `requiere_confirmacion` llevan una marca visible.
- [x] **FORM-03**: Para P2 (portal), la herramienta responde `ok: true` con `data: { ruta, formato: "portal", aviso: "formato no soportado" }` y escribe `out/<caso>/valores-portal.md` con los valores listos para copiar. El flujo sigue hasta el paquete.
- [x] **FORM-04**: `generar_formulario` recibe un `mapeo` que solo trae rutas: un `mapeo` con valores se rechaza con un esquema estricto. La herramienta lee los valores del maestro, de modo que CA2 se cumple por diseño.

### Paquete para firma (HU-4, RN2, RN3)

- [x] **PAQ-01**: `armar_paquete` crea `out/<caso>/paquete/` con el formulario (o `valores-portal.md`), copias de los soportes exigidos que existan en `repositorio/soportes/`, `checklist.md` y `borrador-correo.md`. Devuelve `{ ruta, listo_para_firma, checklist }`.
- [x] **PAQ-02**: `checklist.md` lista los soportes presentes, ausentes y vencidos, los campos faltantes y los que requieren confirmación. Muestra la fecha de ejecución efectiva y avisa cuando un soporte vence pronto ("vence en N días").
- [x] **PAQ-03**: Un soporte vencido (`vigencia_hasta` anterior a la fecha de ejecución) o un soporte exigido ausente bloquea `listo_para_firma`. Un campo `faltante` no bloquea, pero aparece en el checklist.
- [x] **PAQ-04**: `borrador-correo.md` es una respuesta al cliente: va dirigido a `solicitud.de`, con asunto "RE: <asunto>", lista el formulario y los soportes adjuntos, y nunca afirma que el formulario esté firmado: su cierre depende del estado del paquete (GC-1). Se arma con una lista blanca de campos, así que nunca contiene datos bancarios.
- [x] **PAQ-05**: La fecha de ejecución sale de un reloj inyectable. Por defecto es la fecha real en `America/Bogota` y se sobrescribe con `FECHA_EJECUCION`. La comparación se hace sobre fechas ISO, y `vigencia_hasta: null` significa "no aplica" (válido).

### Confirmación y envío simulado (CA3, RN4)

- [x] **ENV-01**: Si `simular_envio` se llama sin confirmación válida, devuelve `{ ok: false, error: "requiere confirmación explícita" }`. Con confirmación, escribe solo `out/<caso>/ENVIO-SIMULADO.md` y deja registrados los bloqueos vigentes. No exige `listo_para_firma`. Si `paquete/` no coincide con lo que se armaría hoy (archivos faltantes, sobrantes o borrador desactualizado), rechaza con `PAQUETE_DESACTUALIZADO` y no escribe nada.
- [x] **ENV-02**: El servidor hace cumplir la compuerta de confirmación. La sesión guarda la confirmación pendiente `{ caso, accion }`, y la autorización vale una sola vez, para ese caso y solo si llega en el mensaje inmediatamente siguiente del usuario. La decide un clasificador determinista que entiende negaciones ("No envíes nada todavía" no confirma) o el botón de la UI. El servidor nunca confía solo en `confirmado: true` del modelo.
- [x] **ENV-03**: Cuando una acción requiere confirmación, el turno termina con una pregunta explícita que lista los bloqueos. El servidor calcula `needsConfirmation`.

### Ciclo del agente (§6.1, §6.3)

- [x] **AGT-01**: El ciclo es propio: prompt → modelo → herramientas → respuesta. Las herramientas se ejecutan en secuencia y hay un tope configurable de iteraciones por turno (25 por defecto). Al alcanzarlo, el agente responde con lo que tiene y lo que falta.
- [x] **AGT-02**: El system prompt vive en `agent/prompt.md` y el conocimiento del proceso en `src/knowledge/registro-proveedor.md`, separados de la ejecución en `src/tools/`. Un cambio de reglas de negocio no toca el servidor.
- [ ] **AGT-03**: El prompt prohíbe afirmar valores que no hayan salido de una herramienta (CA2).
- [x] **AGT-04**: La sesión vive en un store en memoria detrás de una interfaz, con TTL. El historial queda íntegro: cada tool call tiene su resultado y un paso abortado se descarta. La sesión sobrevive a errores de herramienta o del proveedor (CA5).
- [ ] **AGT-05**: Los errores de herramienta y de proveedor se traducen a lenguaje claro en español, a partir de un catálogo centralizado de errores.

### Adaptador LLM y resiliencia (§6.1, §8)

- [x] **LLM-01**: Hay una interfaz propia `enviar(mensajes, herramientas) → respuesta` con un modelo de mensajes neutral. Cambiar de proveedor no toca el ciclo.
- [ ] **LLM-02**: La implementación DeepSeek usa `fetch` directo contra la API compatible con OpenAI. El modelo se lee de env (`deepseek-flash` por defecto), el modo thinking va desactivado, `max_tokens` es explícito y el campo `reasoning_content` se conserva en el tipo.
- [ ] **LLM-03**: Hay timeout al proveedor con mensaje claro. Se reintenta con backoff y jitter solo ante errores transitorios (429, 500, 503 y red). Los errores 400, 401 y 422 no se reintentan, y el 402 se informa como "saldo agotado".
- [ ] **LLM-04**: Un decorador de fallback de proveedor o modelo (por ejemplo `deepseek-flash` → `deepseek-v4-pro`) actúa cuando el primario falla de forma transitoria.
- [x] **LLM-05**: El tope de tokens por sesión y el tope de iteraciones por turno son configurables. Al superarlos, el usuario recibe un mensaje claro, no un 500.
- [ ] **LLM-06**: Existe un modo degradado sin LLM. Si no hay clave, se agotó el saldo o el proveedor cayó, `/api/health` lo reporta y la UI permite correr el flujo determinista de un caso con las mismas herramientas que `demo.ts`.

### API HTTP (§6.4)

- [ ] **API-01**: `POST /api/chat` recibe `{ sessionId, message }` y emite un stream SSE de eventos por paso (`turn_start`, `tool_start`, `tool_end`, `text`, `confirmation_required`, `usage`, `error`, `turn_end`) con heartbeat. También hay un fallback JSON `{ reply, toolCalls[], needsConfirmation }`.
- [ ] **API-02**: `GET /api/sessions/:id` devuelve el historial completo de la sesión, con la PII redactada.
- [ ] **API-03**: `GET /api/health` devuelve `{ ok: true, provider, model }` sin exponer claves y sin pedir código de acceso.
- [ ] **API-04**: El link público exige un código de acceso, comparado en tiempo constante. Hay rate limit por IP, límite de tamaño de mensaje y headers de seguridad.
- [ ] **API-05**: Una ruta de descarga de artefactos sirve `out/<caso>/` con lista blanca de nombres de archivo, detrás del código de acceso.

### Front de chat (§6.1)

- [ ] **UI-01**: El chat muestra el historial, el campo de entrada y un indicador de "pensando" con la herramienta en curso.
- [ ] **UI-02**: Cada tool call queda visible en el chat como tarjeta colapsable, con nombre, args redactados, resultado resumido y estado (en curso, ok o error).
- [ ] **UI-03**: Cuando el agente pide confirmación, la UI lo resalta con una tarjeta que muestra caso, acción y bloqueos, y ofrece los botones Confirmar y Cancelar. Esos botones envían un mensaje explícito del usuario.
- [ ] **UI-04**: Los errores de herramienta o de proveedor aparecen en el chat en lenguaje claro y la sesión sigue usable.
- [ ] **UI-05**: Una tarjeta de resultado por caso, construida con los datos de las herramientas, muestra contadores de lleno, faltante y por confirmar, el badge `listo_para_firma`, los bloqueos y la ruta de salida.
- [ ] **UI-06**: Un panel de artefactos permite descargar o previsualizar los archivos generados del caso.
- [ ] **UI-07**: Hay chips de acción rápida: el prompt §11, procesar los 4 casos y listar los casos.
- [ ] **UI-08**: Un indicador de progreso por caso muestra las etapas leído → mapeado → generado → paquete → confirmación → envío. El `sessionId` persiste en el navegador, el historial se recarga desde la API y hay un botón "Nueva sesión".
- [ ] **UI-09**: La UI muestra la fecha de ejecución efectiva y pide el código de acceso una sola vez.

### Seguridad, PII y observabilidad (§8, RN5, CA4)

- [ ] **SEG-01**: La clave del LLM vive solo en una env var del backend y nunca aparece en el front (sin el prefijo `VITE_`), los logs, las respuestas de la API ni el repo. Existe un `.env.example` sin valores y un test verifica que la clave no esté en `web/dist` ni en las respuestas.
- [ ] **SEG-02**: Una única función `redactar()`, basada en una política de rutas sensibles, se aplica a los logs, la API, el SSE y los resúmenes de tool calls. Un test busca con grep valores PII conocidos y verifica que no aparezcan fuera de los archivos de salida.
- [ ] **SEG-03**: Los logs son JSON estructurados, con IDs de correlación por sesión, turno y tool call, y nunca registran la clave ni PII.
- [x] **SEG-04**: Cada tool call queda registrada en `out/log.jsonl` (CA4) y en `out/<caso>/log.jsonl` (RN5) con `{ ts, herramienta, ok, resumen }`, con el resumen redactado.

### Demo y pruebas (§6.6, §8)

- [x] **DEMO-01**: `bun run demo.ts` ejecuta los 4 casos llamando directamente a las herramientas, sin clave LLM. Limpia `out/` al inicio, fija `FECHA_EJECUCION=2026-09-03`, la imprime y muestra un resumen por caso. El resultado es igual entre ejecuciones, salvo timestamps.
- [x] **DEMO-02**: Hay tests golden por caso con la tabla de verdad: co 17/0/0 y listo; ec 13/1/1 y bloqueado por soporte ausente; hn 9/1/1 y bloqueado por parafiscales vencidos; pa 8/0/1 y listo por la vía del portal.
- [ ] **DEMO-03**: Hay tests unitarios de dominio (mapeo, RN1, vigencias, clasificador de confirmación, redacción), tests de contrato de herramientas (`{ok,data}`, nunca lanzan) y tests del ciclo con un LLM falso: tope de iteraciones, compuerta (incluido "No envíes…" y el guion §11), CA5 tras timeout o 503 e intento de inyección.
- [x] **DEMO-04**: Hay fixtures sintéticos propios en `tests/fixtures/` para la etiqueta ambigua (HU-1), una plantilla corrupta y un caso inexistente (HU-5).
- [ ] **DEMO-05**: GitHub Actions corre `bun test`, `bun run demo.ts`, `tsc --noEmit` y lint, y el README muestra un badge.

### Calidad de código y mantenibilidad

- [x] **CAL-01**: TypeScript estricto sin `any` (`strict` y `noUncheckedIndexedAccess`), verificado con `tsc --noEmit`. Biome se encarga de lint y formato, y `bun run check` los agrupa.
- [x] **CAL-02**: El código no lleva comentarios. Se entiende por sí solo gracias a nombres expresivos, tipos y funciones pequeñas de una responsabilidad. Las explicaciones viven en la documentación, no en el código.
- [x] **CAL-03**: Las constantes y la configuración están centralizadas, tipadas y validadas con zod desde env: rutas, topes, timeouts, umbral de confianza 0.8, tabla país → identificador y catálogo de errores. No hay números ni strings mágicos dispersos.
- [x] **CAL-04**: Las capas tienen dependencias hacia adentro (dominio puro → herramientas/casos de uso → infraestructura → HTTP), sin framework de DI. Solo hay puertos donde existe más de una implementación (LLM, reloj, store de sesión). Un test de arquitectura verifica la dirección de los imports.
- [ ] **CAL-05**: Hay documentación de continuidad (`docs/arquitectura.md` y `docs/convenciones.md`) para que otro dev o una IA retome el proyecto. Los commits siguen Conventional Commits con la identidad `elianatorres5772`.

### Despliegue (§8, §9.3)

- [ ] **DEP-01**: `bun run dev` levanta el front y el backend en local con un solo comando, en menos de 2 minutos en una máquina limpia con las variables de `.env.example`.
- [ ] **DEP-02**: Un Dockerfile portable y un `render.yaml` despliegan en Render free un único servicio que sirve la API y la SPA, con la clave como secret, `FECHA_EJECUCION=2026-09-03` y el health check en `/api/health`. El link público está activo.
- [ ] **DEP-03**: Un script de pre-flight calienta el servicio y verifica health y SSE antes de la defensa. El guion §11 se ensaya sobre el link público.

### Documentación de entrega (§9)

- [ ] **DOC-01**: El `README.md` explica cómo levantar en local con un comando, las variables de entorno, cómo correr `demo.ts`, el link de prueba y el código de acceso.
- [ ] **DOC-02**: `SOLUCION.md` tiene las 10 secciones obligatorias:
  1. Problema.
  2. Arquitectura con diagrama.
  3. Ciclo del agente.
  4. Modelo y costo por caso a partir del `usage` real.
  5. Diseño del portal web (§7.4).
  6. Al menos 3 trade-offs.
  7. Supuestos: fecha de ejecución, envío con bloqueos y rúbrica ausente en §10.
  8. Cobertura por historia de usuario.
  9. Uso de IA.
  10. Riesgos.

### Bonus: módulo reutilizable (§9.4)

- [ ] **MOD-01**: `modulo/` contiene `agent.md` (frontmatter `description`, `mode: primary`, `permission {edit: deny, bash: deny}` y como cuerpo el prompt), `tools/proveedor.ts` y `skill/registro-proveedor/SKILL.md` (frontmatter `name` y `description`, y como cuerpo el conocimiento).
- [ ] **MOD-02**: `modulo/` es fuente única. Un script genera `agent.md` y `SKILL.md` desde `agent/prompt.md` y `src/knowledge/`, y `tools/proveedor.ts` re-exporta las herramientas de la app. Hay tests de igualdad byte a byte, de identidad de referencia y de importación sin env.

## v2 Requirements

Diferidos: se registran, pero no entran al roadmap actual.

### Operación

- **OPS-01**: Medidor de tokens y costo por sesión en la UI (tokens usados contra el tope y USD estimado).
- **OPS-02**: Persistencia de sesiones en archivo para sobrevivir reinicios del servidor.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Envío real por correo (SMTP, Gmail, Graph) | Es un no-objetivo del PRD (§3.2) y el envío es una decisión humana. Se reemplaza con `ENVIO-SIMULADO.md`. |
| Automatización real de portales (Playwright, RPA) | P2 es solo diseño (§7.4) y aparecen CAPTCHA, MFA y credenciales. Va en `SOLUCION.md`. |
| Llenar un AcroForm o parsear los adjuntos reales del cliente (OCR) | Los adjuntos no existen en los fixtures y el PRD acepta un PDF generado. |
| Mapeo con LLM, embeddings o fuzzy matching agresivo | Rompe el determinismo y abre la puerta a valores inventados (CA2). Por ejemplo, propondría la cuenta bancaria para "contribuyente especial". |
| Edición de valores desde la UI o escritura al maestro | Viola el Core Value: aparecerían valores que no salen de las herramientas. |
| Login, roles, multiusuario o base de datos | Es un no-objetivo del PRD (§3.2). Basta con un código de acceso compartido. |
| Frameworks de agentes (LangChain, LangGraph, Mastra) | El ciclo, el tope y la confirmación son justo lo que se evalúa, y un framework los esconde. |
| Conversión de moneda o generación y validación de RUC/RTN | Sería inventar datos. El PRD exige usar el NIT con `requiere_confirmacion`. |
| Aprobación modal para cada tool call | Genera fatiga de aprobación. La compuerta aplica solo a acciones externas. |
| Mostrar el razonamiento crudo del modelo | Es ruido, cuesta tokens y arriesga filtrar PII o el prompt. |
| Streaming token a token de los args de las tools | Aporta poco valor y tiene bugs sutiles. Basta con SSE por pasos. |
| WebSockets, colas o workers | SSE sobre POST cubre la necesidad. |
| RAG, vector DB o memoria entre sesiones | El conocimiento es un Markdown pequeño que entra completo en el contexto. |
| Selector de proveedor en la UI, i18n, tema oscuro, pulido móvil | No suma puntos de rúbrica. El adaptador ya demuestra que el proveedor es intercambiable. |
| Pedir o guardar credenciales del portal en el chat | Viola §7.4: las credenciales nunca van en el prompt ni en los logs. |
| Bloquear `simular_envio` cuando el paquete no está listo para firma | Rompe el guion §11 (ec-corp-andina siempre está bloqueado). En su lugar, los bloqueos quedan registrados. |
| Modificar `reto-01/PRD.md` o los fixtures | Los entregó Periferia y deben quedar intactos. |

## Traceability

Cada requisito v1 está asignado a exactamente una fase del roadmap (`.planning/ROADMAP.md`).

| Requirement | Phase | Status |
|-------------|-------|--------|
| HERR-01 | Phase 1 | Complete |
| HERR-02 | Phase 1 | Complete |
| HERR-03 | Phase 1 | Complete |
| HERR-04 | Phase 1 | Complete |
| HERR-05 | Phase 1 | Complete |
| SOLI-01 | Phase 1 | Complete |
| SOLI-02 | Phase 1 | Complete |
| SOLI-03 | Phase 2 | Pending |
| MAP-01 | Phase 1 | Complete |
| MAP-02 | Phase 1 | Complete |
| MAP-03 | Phase 1 | Complete |
| MAP-04 | Phase 1 | Complete |
| MAP-05 | Phase 1 | Complete |
| MAP-06 | Phase 1 | Complete |
| MAP-07 | Phase 1 | Complete |
| FORM-01 | Phase 1 | Complete |
| FORM-02 | Phase 1 | Complete |
| FORM-03 | Phase 1 | Complete |
| FORM-04 | Phase 1 | Complete |
| PAQ-01 | Phase 1 | Complete |
| PAQ-02 | Phase 1 | Complete |
| PAQ-03 | Phase 1 | Complete |
| PAQ-04 | Phase 1 | Complete |
| PAQ-05 | Phase 1 | Complete |
| ENV-01 | Phase 1 | Complete |
| ENV-02 | Phase 2 | Complete |
| ENV-03 | Phase 2 | Complete |
| AGT-01 | Phase 2 | Complete |
| AGT-02 | Phase 2 | Complete |
| AGT-03 | Phase 2 | Pending |
| AGT-04 | Phase 2 | Complete |
| AGT-05 | Phase 2 | Pending |
| LLM-01 | Phase 2 | Complete |
| LLM-02 | Phase 2 | Pending |
| LLM-03 | Phase 2 | Pending |
| LLM-04 | Phase 2 | Pending |
| LLM-05 | Phase 2 | Complete |
| LLM-06 | Phase 3 | Pending |
| API-01 | Phase 3 | Pending |
| API-02 | Phase 3 | Pending |
| API-03 | Phase 3 | Pending |
| API-04 | Phase 3 | Pending |
| API-05 | Phase 3 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| UI-07 | Phase 3 | Pending |
| UI-08 | Phase 3 | Pending |
| UI-09 | Phase 3 | Pending |
| SEG-01 | Phase 3 | Pending |
| SEG-02 | Phase 1 | Partial — política de rutas PII y test grep listos; falta `redactar()` única para logs/API/SSE (Fases 2–3) |
| SEG-03 | Phase 2 | Pending |
| SEG-04 | Phase 1 | Complete |
| DEMO-01 | Phase 1 | Complete |
| DEMO-02 | Phase 1 | Complete |
| DEMO-03 | Phase 2 | Pending |
| DEMO-04 | Phase 1 | Complete |
| DEMO-05 | Phase 4 | Pending |
| CAL-01 | Phase 1 | Complete |
| CAL-02 | Phase 1 | Complete |
| CAL-03 | Phase 1 | Complete |
| CAL-04 | Phase 1 | Complete |
| CAL-05 | Phase 4 | Pending |
| DEP-01 | Phase 3 | Pending |
| DEP-02 | Phase 3 | Pending |
| DEP-03 | Phase 4 | Pending |
| DOC-01 | Phase 4 | Pending |
| DOC-02 | Phase 4 | Pending |
| MOD-01 | Phase 4 | Pending |
| MOD-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 73 total
- Mapped to phases: 73 (Phase 1: 33 · Phase 2: 15 · Phase 3: 18 · Phase 4: 7)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-12*
*Last updated: 2026-10-13 after Phase 1 completion*
