# Phase 1: Núcleo determinista - Context

**Gathered:** 2026-10-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Núcleo sin LLM. Comprende el dominio puro, las 5 herramientas `proveedor_*` (`leer_solicitud`, `mapear_campos`, `generar_formulario`, `armar_paquete` y `simular_envio`), la generación de formularios xlsx, pdf y portal, el paquete para firma, los logs jsonl y `demo.ts` con golden tests. Al terminar, cualquiera puede correr `bun run demo.ts` sin clave LLM y obtener salidas correctas y reproducibles de los 4 casos con fecha 2026-09-03. Cada valor sale del maestro a través de una herramienta tipada.

Quedan fuera de esta fase el ciclo del agente, el adaptador LLM, la compuerta de confirmación del servidor (Fase 2), la API HTTP/SSE, el front y el deploy (Fase 3), y `modulo/` y la documentación de entrega (Fase 4). El layout de rutas canónicas (`src/tools/proveedor.ts`, `src/knowledge/`, `agent/`) se respeta desde ya para que `modulo/` pueda reutilizarlas.

</domain>

<decisions>
## Implementation Decisions

### Marcas de pendientes en los formularios
- **D-01:** En el xlsx, la celda de valor de un campo `faltante` queda **vacía**, con relleno rojo claro y un comentario de celda: "Faltante: no existe en el maestro". Nunca se escribe un texto marcador que pueda terminar firmado.
- **D-02:** En el xlsx, un campo `requiere_confirmacion` lleva el **valor real del maestro** (por ejemplo, el NIT), con relleno amarillo y un comentario con la nota (por ejemplo, "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano"). El valor de la celda queda limpio, sin sufijos.
- **D-03:** En el PDF generado, un faltante se muestra como `[FALTANTE]` en rojo, y un campo por confirmar como su valor seguido de `[POR CONFIRMAR]` en ámbar. Al final va una sección "Notas" con el motivo de cada uno. Solo se usa texto WinAnsi, sin íconos como ⚠ o ✓, porque pdf-lib lanza con caracteres fuera de WinAnsi. Hay que sanear antes de escribir.
- **D-04:** Los valores se escriben **crudos y exactos del maestro** ("CO", "98000000000"), siempre como texto para preservar los ceros a la izquierda. El contexto va en una nota o comentario aparte (por ejemplo, "COP, año 2025" para Ingresos anuales en clientes no-CO, o la nota de País). Trazabilidad: 1 ruta = 1 valor, sin formateo ni composición.

### Qué ve el LLM (minimización de PII)
- **D-05:** `valor_enmascarado` muestra en claro **solo una lista blanca de datos corporativos públicos**: `razon_social`, `tipo_sociedad`, `ciudad`, `departamento`, `pais`, `sitio_web`, `actividad_economica`, `ciiu_principal`, `ciiu_secundario`, `regimen_tributario` y `numero_empleados`. Todo lo demás va enmascarado: personas, documentos, banco, contactos y montos. Una ruta nueva del maestro queda **oculta por defecto**. — **Reversibility:** costly — el contrato de salida de `mapear_campos` lo consumen el prompt, los golden tests, la UI y `modulo/`.
- **D-06:** El **NIT va enmascarado** hacia el LLM ("•••••3456").
- **D-07:** El patrón de enmascarado depende del tipo de dato:
  - Números y códigos: últimos 4 caracteres ("••••5123").
  - Nombres de persona: iniciales ("R. A. S.").
  - Correos: "l•••@periferia-ficticia.com".
  - Teléfonos: "+57 ••• ••• 0101".
  - Montos: "[monto oculto]".
  - La cuenta bancaria y el SWIFT nunca muestran más de 4 caracteres.
- **D-36 (post-research):** Las notas de contexto que ve el LLM pueden incluir datos no sensibles, tomados de una **lista blanca en código** junto a la política de PII: `ingresos_ultimo_ano.moneda`, `ingresos_ultimo_ano.ano`, `pais` y los textos fijos de `reglas.json` ("identificador extranjero", etc.). El monto sigue como "[monto oculto]".
- **D-08:** La política de PII (lista blanca y patrones) **vive en código** (`src/domain`), no como dato editable. Es una decisión de seguridad y no se puede relajar editando un archivo.
- **D-09:** El rol del LLM, aclarado con la usuaria: orquesta la secuencia de herramientas, conversa y explica en español, responde seguimientos y llega a la pregunta de confirmación. **Nunca** aporta valores, mapea campos, decide vigencias ni autoriza envíos. Este trade-off se documenta en `SOLUCION.md` §6 (Fase 4).

### Encadenamiento de herramientas
- **D-10:** `armar_paquete` sin un formulario generado devuelve el error guía `FORMULARIO_NO_GENERADO` ("Primero genera el formulario…"). Ninguna herramienta ejecuta pasos de otra a escondidas.
- **D-11:** `generar_formulario` recibe `{ caso, mapeo }`, donde `mapeo` trae solo rutas y es `.strict()`. La herramienta **recalcula el mapeo canónico determinista** y lo compara con el recibido. Si difiere (otra ruta, un estado "subido" de `requiere_confirmacion` a `lleno`, campos de más o de menos), responde `MAPEO_INCONSISTENTE`. Los valores siempre se leen del maestro. — **Reversibility:** one-way — forma parte del contrato público de herramientas que expone `modulo/` y que valida la rúbrica (CA2).
- **D-12:** Al reprocesar un caso, `generar_formulario` sobrescribe `formulario.*` y `mapeo.json` y **borra el `paquete/` y el `ENVIO-SIMULADO.md` previos**. Así nunca queda un paquete armado con un formulario viejo. Los `log.jsonl` se conservan en modo append.
- **D-13:** `simular_envio` exige un paquete armado: si no existe, responde `PAQUETE_NO_ARMADO`. Sin `confirmado: true`, responde "requiere confirmación explícita". No exige `listo_para_firma` (decisión previa) y deja registrados en `ENVIO-SIMULADO.md` los bloqueos vigentes. La compuerta real del servidor llega en la Fase 2.
- **D-14:** Para listar casos: `leer_solicitud` con un caso inexistente (o vacío) responde `CASO_NO_ENCONTRADO` más `casos_disponibles: [...]`. Se mantienen **exactamente 5 herramientas**, y el conocimiento indica que esta es la forma de listar.
- **D-15:** `mapear_campos` acepta en `campos[]` **cualquier subconjunto de las etiquetas de la plantilla del caso**, comparadas con la misma normalización del glosario, para responder preguntas puntuales. Una etiqueta fuera de la plantilla da `CAMPOS_FUERA_DE_PLANTILLA` con la lista esperada. `out/<caso>/mapeo.json` siempre persiste el mapeo canónico **completo**.

### Errores y continuación (HU-5)
- **D-16:** Forma del error: `{ ok: false, error: "<mensaje en español>", codigo: "<CODIGO_ESTABLE>" }`. `error` sigue siendo un string (literal del PRD §6.2, por ejemplo "requiere confirmación explícita"), y `codigo` es un hermano en MAYÚSCULAS. Los mensajes salen de un catálogo centralizado y nunca llevan traza cruda. — **Reversibility:** one-way — es el contrato de salida de las 5 herramientas, lo consumen tests, UI, el ciclo y `modulo/`.
- **D-17:** Continuación parcial: ante una plantilla corrupta (o una falla similar), la respuesta es `{ ok: false, codigo: "PLANTILLA_INVALIDA", error, parcial: { pais, cliente, formato, soportes } }`, para que el agente pueda reportar los soportes aunque no pueda mapear. Una falla nunca se esconde detrás de `ok: true`.
- **D-18:** Códigos que hay que cubrir como mínimo:
  - De dominio y flujo: `CASO_NO_ENCONTRADO`, `CASO_INVALIDO` (traversal o regex), `PLANTILLA_INVALIDA`, `REGLAS_INVALIDAS`, `ARGS_INVALIDOS`, `MAPEO_INCONSISTENTE`, `CAMPOS_FUERA_DE_PLANTILLA`, `FORMULARIO_NO_GENERADO`, `PAQUETE_NO_ARMADO`, `CONFIRMACION_REQUERIDA`.
  - Genérico: `ERROR_INTERNO`, siempre con un mensaje claro.

### Mapeo y confianza
- **D-19:** La escala de confianza es fija y se define como dato en `reglas.json` (umbral 0.8):

  | Regla | Confianza | Estado |
  |---|---|---|
  | Glosario exacto | 1.0 | `lleno` |
  | Glosario normalizado | 0.95 | `lleno` |
  | Clave directa del maestro | 0.85 | `lleno` |
  | Regla de país o identificador extranjero | 0.6 | `requiere_confirmacion` |
  | Etiqueta genérica | 0.5 | `requiere_confirmacion` |
  | Sin fuente | 0 | `faltante` |

- **D-20:** Una etiqueta genérica ("Identificación tributaria", "Número de identificación fiscal") es `requiere_confirmacion` **siempre, incluso para CO**, y propone el equivalente del país (NIT/RUC/RTN), literal a HU-1. La lista de etiquetas genéricas vive en `reglas.json` y se prueba con un fixture sintético en `tests/fixtures/`.
- **D-21:** La tabla de verdad (golden) no cambia: co 17/0/0 listo; ec 13/1/1 bloqueado por soporte ausente; hn 9/1/1 bloqueado por parafiscales vencidos; pa 8/0/1 listo por la vía del portal.

### Soportes y vigencias
- **D-22:** Si un soporte existe pero su `pais_emisor` es distinto del país del cliente, cuenta como **presente** y el checklist agrega un aviso **no bloqueante**: "Emitido en CO: confirmar si el cliente lo acepta". La tabla de verdad no cambia.
- **D-23:** El aviso "vence en N días" aparece cuando faltan **30 días o menos**, un valor configurable en `reglas.json`. Con fecha 2026-09-03, la cámara de comercio avisa "vence en 27 días".

### Textos de salida
- **D-24:** La consola de `demo.ts` arranca con un encabezado que muestra la fecha efectiva. Luego imprime un **bloque corto por caso** (formato, ruta, conteos lleno/faltante/por confirmar, soportes ausentes y vencidos, LISTO o BLOQUEADO con su motivo) y al final una **tabla resumen** de los 4 casos. Nunca imprime valores reales.
- **D-25:** `borrador-correo.md` lo **firma la analista desde el maestro**: `contacto_financiero.nombre` y `contacto_financiero.cargo` más la razón social. Se arma con una **lista blanca explícita de campos** que excluye `banco.*`. Va dirigido a `solicitud.de` con el asunto "RE: <asunto>". Los valores reales están permitidos en los archivos de salida, pero el LLM nunca los ve.
- **D-26:** El borrador lista el formulario y los soportes adjuntos. Si hay campos faltantes o soportes ausentes, agrega un párrafo breve: "Quedan pendientes: … los enviaremos por separado". Nunca incluye datos bancarios ni valores del formulario.
- **D-27:** `checklist.md` tiene esta estructura:
  - Encabezado con caso, cliente, fecha de ejecución efectiva y estado LISTO o BLOQUEADO con sus motivos.
  - Tabla de soportes con tipo, archivo, vigencia, estado, "vence en N días" y el aviso de país emisor.
  - Listas de campos faltantes y de campos por confirmar, con su nota.
  - Una sección final de acciones con casillas `- [ ]` para la analista.

### Reglas de negocio como datos (sin tocar el servidor)
- **D-28:** Requisito explícito de la usuaria: las reglas de negocio y los textos tienen que poder cambiar **sin tocar código del servidor**. Viven como datos en `src/knowledge/`: un `reglas.json` validado con zod más plantillas `.md` con placeholders. Las herramientas los **leen en cada ejecución, sin caché**, así que en local un cambio aplica sin reiniciar y en Render basta un push. Si una regla es inválida, la respuesta es `REGLAS_INVALIDAS` en español, nunca un crash. — **Reversibility:** costly — la carga por ejecución y el esquema de `reglas.json` los consumen todas las herramientas y `modulo/`.
- **D-29:** Qué va como dato editable:
  - La tabla país → identificador (CO→NIT; EC, PE y PA→RUC; HN→RTN), la nota "identificador extranjero" y las notas de contexto (moneda y año, país).
  - Umbrales y plazos: confianza 0.8, la escala de D-19 y el aviso de vencimiento de 30 días.
  - La lista de etiquetas genéricas.
  - Las plantillas de `borrador-correo`, `checklist`, `ENVIO-SIMULADO` y `valores-portal`.

  La **política de PII no** va como dato (D-08). El glosario sigue siendo el fixture de solo lectura en `reto-01/`.

### Librerías y cadena de suministro
- **D-30:** Dependencias de runtime de la Fase 1: **zod 4.6.7**, **exceljs 4.4.0** y **pdf-lib 1.17.1**. Las de desarrollo: **typescript 7.0.2**, **@biomejs/biome 2.5.15** y **@types/bun 1.4.3**. El 2026-10-12 se verificó con `npm view` que todas son la última versión publicada. Los logs jsonl, la redacción y el reloj son código propio, sin dependencias. pino entra en la Fase 2. exceljs se elige sobre SheetJS porque escribe estilos y comentarios de celda, que D-01 y D-02 necesitan.
- **D-31:** Política de cadena de suministro:
  - Versiones **exactas, sin `^`**.
  - `bun.lock` commiteado, y CI y Docker con `--frozen-lockfile`.
  - `"overrides": { "uuid": "^11.1.1" }`. Verificado: `bun audit` pasa de 1 moderate (GHSA-w5hq-g745-h8pq vía exceljs) a 0, y exceljs sigue escribiendo y releyendo `03100012345` con su comentario.
  - **`bun audit` dentro de `bun run check`, que falla desde moderate.**
  - Cada dependencia se justifica en `SOLUCION.md`.

  La usuaria pidió validar siempre versiones y vulnerabilidades y usar lo recomendado y reciente: el planner o el executor deben volver a correr `npm view` y `bun audit` al instalar.
- **D-32:** **Bun 1.4.3 fijo**, en `.bun-version`, `engines` y la imagen `oven/bun:1.4.3-slim`. La máquina local tiene 1.3.10, así que el plan debe incluir `bun upgrade` (o avisar a la usuaria) antes de depender de `bun check`.

- **D-35 (enmienda a D-30, post-research 2026-10-12):** Se aplica una política de **madurez de 7 días o más**: no se fija ninguna versión publicada hace menos de 7 días, como protección de cadena de suministro. Versiones fijadas: **zod 4.6.5** (2026-09-13), **@types/bun 1.4.2** (2026-09-08), **@biomejs/biome 2.5.15** (2026-09-30), **typescript 7.0.2**, **exceljs 4.4.0** y **pdf-lib 1.17.1**. zod 4.6.7 y @types/bun 1.4.3 se descartan porque se publicaron el mismo día. El runtime Bun 1.4.3 (D-32) se mantiene porque corrige regresiones de 1.4.x y la investigación lo verificó. Al instalar se corre `npm view <pkg> time` y `bun audit --audit-level=moderate`.

### Validación zero-trust
- **D-33:** No se confía en ninguna entrada, y hay validación zod en cada frontera del backend:
  1. Args con `.strict()`. `caso` debe cumplir `^[a-z0-9-]{1,64}$`, y la ruta resuelta (con `realpath`, contra symlinks) tiene que quedar dentro del directorio de casos.
  2. Todos los fixtures (maestro, solicitud, plantillas, índice de soportes, glosario) y `reglas.json` se validan con esquemas zod al leerlos.
  3. Solo se escribe dentro de `out/<caso>/`, con nombres de archivo en lista blanca.
  4. Hay un límite de tamaño para los archivos leídos.
  5. Los valores van a las celdas como **texto, nunca como fórmulas**. No se antepone `'`, porque alteraría valores como "+57…".
  6. No hay shell.
- **D-34:** El principio para el front (se implementa en la Fase 3, pero queda fijado ya): **el front valida para la UX y el backend decide**. Los esquemas zod se comparten desde `src/contracts/`, y el front nunca renderiza HTML del modelo.

### Claude's Discretion
- El layout del PDF (márgenes, tipografía, wrapping y paginado), dentro de D-03.
- El contenido exacto de `ENVIO-SIMULADO.md` y `valores-portal.md`, siguiendo el espíritu de D-26 y D-27, con plantillas como dato (D-29).
- La estructura interna de carpetas de `src/` (domain, tools, infra), el `defineTool` y el mutex por caso, según `.planning/research/ARCHITECTURE.md` y sin sobreingeniería (Pitfall 17).
- El contenido del `resumen` redactado de cada línea de `log.jsonl`, y dónde se registra una llamada que falla antes de conocer un caso válido (solo en el log global).
- Los colores exactos de los rellenos del xlsx y de las marcas del PDF.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Especificación fuente (vinculante, no modificar)
- `reto-01/PRD.md`: el contrato completo. Para esta fase interesan sobre todo §5 (HU-1 a HU-5), §6.2 (contrato de herramientas), §6.5 (estructura), §6.6 (`demo.ts`), §7 (fixtures y RN1 a RN5) y §8 (no funcionales).
- `reto-01/fixtures/reto-01/`: los fixtures de solo lectura (maestro, glosario, índice de soportes y los 4 casos). Su ruta es una constante de configuración.

### Planeación del proyecto
- `.planning/REQUIREMENTS.md`: los requisitos de la Fase 1 (HERR, SOLI-01/02, MAP, FORM, PAQ, ENV-01, SEG-02/04, DEMO-01/02/04 y CAL-01 a CAL-04) y la tabla de "Out of Scope".
- `.planning/ROADMAP.md`: el objetivo y los 5 criterios de éxito de la Fase 1.
- `.planning/PROJECT.md`: el Core Value, las restricciones y las Key Decisions.
- `.planning/STATE.md`: las decisiones de inicialización (FECHA_EJECUCION, envío con bloqueos, portal `ok:true` y borrador como respuesta).
- `.claude/CLAUDE.md`: las reglas de código del proyecto (sin comentarios, sin `any`, config centralizada, dependencias hacia adentro, dominio en español, commits con identidad `elianatorres5772`).

### Investigación
- `.planning/research/SUMMARY.md`: la síntesis, la tabla de verdad y el enfoque por fases.
- `.planning/research/ARCHITECTURE.md`: estructura recomendada (§Recommended Project Structure), `defineTool` que nunca lanza (Pattern 1), wiring lazy (Pattern 2), minimización de PII (Pattern 6), config de dos niveles (Pattern 7), reloj inyectado (Pattern 8) y anti-patrones.
- `.planning/research/PITFALLS.md`: fecha de ejecución, valores del modelo hacia formularios, path traversal, WinAnsi en pdf-lib, ceros a la izquierda y sobreingeniería (Pitfall 17).
- `.planning/research/STACK.md`: versiones y verificaciones de exceljs, pdf-lib, zod `toJSONSchema` y Bun.
- `.planning/research/FEATURES.md`: table stakes, diferenciadores (DF-02 mapeo sin valores, DF-03 trazabilidad, DF-18 redacción) y anti-features.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Ninguno: el proyecto es greenfield. No existen `src/`, `package.json`, `tsconfig` ni `.gitignore`.

### Established Patterns
- Todavía no hay patrones en el código. Los patrones a seguir están en `.planning/research/ARCHITECTURE.md` y en las reglas de `.claude/CLAUDE.md`.

### Integration Points
- `reto-01/` está **sin trackear en git** (`?? reto-01/`). Hay que commitearlo intacto, porque los fixtures son datos de runtime necesarios en CI y en la imagen Docker de Render.
- No existe `.gitignore`. Debe ser lo primero que se crea (`node_modules/`, `out/`, `.env`, `.DS_Store`), junto con `.dockerignore`.
- Rutas canónicas que la Fase 4 (`modulo/`) va a reutilizar: `src/tools/proveedor.ts` (las 5 exportaciones, importables sin servidor ni secretos), `src/knowledge/registro-proveedor.md` (conocimiento) y `src/knowledge/reglas.json` más las plantillas (D-28).
- El contexto de las herramientas acepta `sessionId` o `sessionID` (HERR-05, por compatibilidad con OpenCode).

</code_context>

<specifics>
## Specific Ideas

- La usuaria quiere que **los cambios de reglas de negocio y de textos no requieran tocar código del servidor**. Es un criterio explícito y se extiende a cualquier decisión futura de este tipo.
- La usuaria pidió **validar versiones y vulnerabilidades** de todas las librerías antes de usarlas y preferir lo recomendado y reciente. El backend **no confía en nada que venga del usuario** (ni del modelo), y el front también valida donde haga falta.
- La usuaria preguntó para qué sirve el LLM si el núcleo es determinista. La respuesta (D-09) debe quedar visible en `SOLUCION.md` como trade-off.
- El grep `71555123|03100012345|COLOCOBM` sobre logs, borradores y respuestas de herramientas debe devolver vacío. El NIT `900123456` también va enmascarado hacia el LLM (D-06).

</specifics>

<deferred>
## Deferred Ideas

- **Confirmación campo a campo desde el chat:** que la analista marque un `requiere_confirmacion` como aceptado (por ejemplo, "sí, usa el NIT como RTN") y que el formulario quite la marca. Es una capacidad nueva y se registra para el backlog.
- **Carpeta de reglas externa por env (`REGLAS_DIR`)** para cambiar reglas sin commit. Hoy aporta poco porque Render free no tiene disco persistente. Se reevalúa si cambia el hosting.
- **Validaciones de front:** el principio queda fijado en D-34 y su implementación va en la Fase 3.

</deferred>

---

*Phase: 01-n-cleo-determinista*
*Context gathered: 2026-10-12*
