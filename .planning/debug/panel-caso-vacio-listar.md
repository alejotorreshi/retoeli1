---
status: diagnosed
trigger: "G-03-17 (UAT test 17): '¿Qué casos hay?' hace que el modelo llame proveedor_leer_solicitud con caso:\"\"; el panel agrega un caso en blanco con 'Leído' en error y pide GET /api/casos//archivos dos veces (404)."
created: 2026-10-15T14:10:00Z
updated: 2026-10-15T14:36:00Z
goal: find_root_cause_only
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (determinista: cada "¿Qué casos hay?" lo reproduce, con el LLM falso y con el real)
hypothesis: CONFIRMADA. El listado diseñado (leer_solicitud con caso "") llega al front como caso:"" (no null); los selectores del panel (plegarTurno y casosDelTurno en web/src/state/casos.ts) solo descartan null, así que "" crea un bloque de caso fantasma que dispara useArchivos("") → GET /api/casos//archivos.
next_action: ninguna (goal find_root_cause_only); devolver ROOT CAUSE FOUND al orquestador.

reasoning_checkpoint:
  hypothesis: "El panel muestra un caso en blanco porque el servidor emite caso:\"\" (casoDeArgumentos acepta cualquier string) para el listado de casos diseñado (leer_solicitud con caso \"\"), y los selectores del front que deciden qué es un caso (plegarTurno L226 y casosDelTurno L266 de web/src/state/casos.ts) solo descartan null; el bloque resultante es el más reciente, se abre y useArchivos pide /api/casos//archivos."
  confirming_evidence:
    - "Ejecución real del bucle con el LLM falso (scratchpad/repro-servidor.test.ts): tool_start y tool_end llevan caso:\"\", ok:false, CASO_NO_ENCONTRADO, resultado:null."
    - "Reductor y selectores reales del front (scratchpad/repro-caso-vacio.ts): con caso \"\" → progresoPorCaso = [{caso:\"\", leido:en_curso}] en vivo y [{caso:\"\", leido:error}] al cerrar; marcasDeArchivos pasa de [] a [[\"\",1]]; rutaDeArchivos(\"\") = /api/casos//archivos. Con caso null (control) → 0 bloques y 0 marcas."
    - "El cambio de marca 0→1 al cerrar el turno re-ejecuta el efecto de useArchivos: explica exactamente los DOS GET /api/casos//archivos (404) de la consola en T12."
  falsification_test: "Si el cable trajera caso:null para el listado, o si plegarTurno descartara \"\", el bloque no aparecería: el control con caso:null da 0 bloques, así que la hipótesis predice el resultado en ambos sentidos."
  fix_rationale: "Normalizar en la fuente (casoDeArgumentos → null si el caso no cumple PATRON_CASO) quita el \"\" del cable SSE, de la vista de sesión (recarga), de la bitácora y del resumen de cierre; un predicado único en el front (caso no vacío/válido) en plegarTurno, casosDelTurno y plegarPorCaso blinda contra el mismo error desde la hidratación o desde servidores viejos. Ataca el origen (\"\" tratado como caso) y no el síntoma (404)."
  blind_spots: "Un caso no vacío pero inexistente (p. ej. el modelo pide 'pe-andes-logistica') también terminaría en CASO_NO_ENCONTRADO y crearía un bloque con Leído=error y un 404 del listado de archivos; decidir si el panel debe ignorar también llamadas con codigo CASO_NO_ENCONTRADO es de alcance del fix. No verifiqué en el navegador (el diagnóstico es por reductor y por bucle reales; la captura de T12 lo documenta)."
  candidate_causes:
    - "code (front): plegarTurno/casosDelTurno/plegarPorCaso filtran solo null — CONFIRMADA, condición necesaria."
    - "code (servidor/contrato): casoDeArgumentos con z.object({caso: z.string()}) emite \"\" en vez de null; el contrato caso: string | null no distingue 'sin caso' de 'caso vacío' — CONFIRMADA, condición necesaria."
    - "config/prompt: src/knowledge/registro-proveedor.md ordena caso \"\" para listar — por diseño (D-14, UI-07, tests/loop/listar-casos.test.ts); NO es defecto."
    - "data/test: tests/web/progreso.test.ts:284 modela el listado con caso:null — explica por qué no se detectó, no causa el fallo."
  and_gate: "Sí. El síntoma necesita a la vez que el servidor emita \"\" (no null) Y que el front solo descarte null. Cualquiera de las dos correcciones sola lo evita; root_cause es un conjunto de dos condiciones contribuyentes, con el filtro del front como punto de decisión de UI y la extracción del caso en el servidor como origen del valor."

## Symptoms

expected: Preguntar '¿Qué casos hay?' responde con los 4 casos y el panel lateral ("Casos de esta sesión") no muestra ningún bloque de caso nuevo.
actual: El modelo lista los casos llamando proveedor_leer_solicitud con caso:"" (el modelo real de DeepSeek en QA T19 sobre Render; el LLM falso guionado en T12 también). El panel agrega un bloque de caso con encabezado vacío, etapa 'Leído' en error y "No pudimos traer los archivos… Reintentar", y el navegador pide GET /api/casos//archivos dos veces (404).
errors: GET /api/casos//archivos → 404 (dos veces); tool_end de leer_solicitud con caso "" (modo listado según tests/loop/listar-casos.test.ts, D-14) muestra CASO_NO_ENCONTRADO en la tarjeta remota según el runner A.
reproduction: UAT test 17 (QA T12). Evidencia: .qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md bloques T12 y T19; captura .qa/evidence/03-chat-web-api-sse-y-despliegue/screenshots/03-test12-panel-caso-vacio.png
started: Descubierto en UAT (2026-10-15).

## Eliminated

- hypothesis: El modelo usa mal la herramienta (el prompt no le dice cómo listar) y por eso manda caso "".
  evidence: src/knowledge/registro-proveedor.md:17 ordena explícitamente caso "" para listar, y tests/loop/listar-casos.test.ts fija ese contrato (D-14, "no hace falta una sexta herramienta"). El modelo real y el falso cumplen el diseño.
  timestamp: 2026-10-15T14:14:00Z

- hypothesis: La capa HTTP/SSE transforma null en "" al serializar.
  evidence: src/http/services/sse.service.ts:toSseFrame solo hace JSON.stringify(redactar(evento)); SseEvent = EventoAgente. El "" ya sale de paso-herramientas.service.ts:54 (casoDeArgumentos).
  timestamp: 2026-10-15T14:30:00Z

## Evidence

- timestamp: 2026-10-15T14:10:00Z
  checked: .planning/debug/knowledge-base.md
  found: No existe base de conocimiento; ninguna sesión resuelta trata del panel de casos ni del listado.
  implication: Sin patrón conocido; investigación abierta.

- timestamp: 2026-10-15T14:14:00Z
  checked: src/knowledge/registro-proveedor.md:15-17 y tests/loop/listar-casos.test.ts
  found: El conocimiento del agente dice textualmente "Si la analista pregunta qué casos hay, llama a proveedor_leer_solicitud con el caso vacío (\"\")". El test listar-casos fija ese contrato (D-14, UI-07, "no hace falta una sexta herramienta") y exige que termine en ok:false + CASO_NO_ENCONTRADO con parcial.casos_disponibles.
  implication: caso "" con fallo CASO_NO_ENCONTRADO es el camino de listado DISEÑADO, no un error del modelo. El modelo real y el LLM falso hacen lo que se les pide; el defecto no está en el prompt.

- timestamp: 2026-10-15T14:16:00Z
  checked: src/loop/services/despacho-llamada.service.ts:21-28 (casoDeArgumentos) y src/loop/schemas/resultado-herramienta.schema.ts:23 (argumentosConCasoSchema = z.object({ caso: z.string() }))
  found: casoDeArgumentos devuelve null solo si los argumentos no tienen caso string; con { caso: "" } devuelve "". src/loop/services/paso-herramientas.service.ts:54 copia ese valor al campo caso de tool_start y tool_end. resumida() (línea 22) también lo guarda en turno.llamadas, que hidrata la vista de sesión tras recargar.
  implication: El servidor emite caso:"" (no null) en los eventos SSE y en la vista de sesión para el listado. El contrato del cable (caso: string | null) no distingue "sin caso" de "caso vacío".

- timestamp: 2026-10-15T14:18:00Z
  checked: web/src/state/conversacion.ts:177-221 (abrirLlamada, llamadaCerrada, cerrarLlamada) y web/src/state/hidratacion.ts:30
  found: El front copia evento.caso tal cual a LlamadaDelTurno.caso (sin normalizar "" a null), tanto en vivo como al hidratar.
  implication: LlamadaDelTurno.caso === "" para la llamada de listado.

- timestamp: 2026-10-15T14:20:00Z
  checked: web/src/state/casos.ts:218-229 (plegarTurno), 150-167 (cambiosDeLlamada), 265-276 (casosDelTurno/marcasDeArchivos), 78-86 (plegarPorCaso)
  found: plegarTurno registra progreso con `if (llamada.caso !== null)` → "" pasa; cambiosDeLlamada da [LEIDO, EN_CURSO] en tool_start y [LEIDO, ERROR] en tool_end (CASO_NO_ENCONTRADO). casosDelTurno filtra solo `llamada.caso === null` → marcasDeArchivos cuenta "" en los turnos terminados. plegarPorCaso (tarjeta de resultado) también filtra solo null, pero se salva porque resultado === null (resultadoVisible da null para un leer_solicitud fallido).
  implication: progresoPorCaso devuelve un ProgresoDeCaso con caso "" y Leído=error. Al ser el de actividad más reciente queda primero (reciente=true).

- timestamp: 2026-10-15T14:22:00Z
  checked: web/src/components/panel-casos.tsx (BloqueCaso), web/src/hooks/usar-archivos.ts, web/src/api/cliente-api.ts:303-321
  found: BloqueCaso pinta <h3>{progreso.caso}</h3> (encabezado vacío) y, como reciente=true → abierto=true, useArchivos llama listarArchivos("") → rutaDeArchivos("") = /api/casos//archivos → 404 → LISTA_CON_ERROR ("No pudimos traer los archivos… Reintentar"). El efecto depende de `marca`: durante el turno marca=0 (marcasDeArchivos excluye el turno en curso); al terminar el turno marca pasa a 1 → segundo pedido.
  implication: Explica el encabezado vacío, el Leído en error, el aviso de archivos y los DOS GET /api/casos//archivos (marca 0 en vivo y marca 1 al cerrar el turno).

- timestamp: 2026-10-15T14:24:00Z
  checked: tests/web/progreso.test.ts:284-298 ("una herramienta sin caso no agrega bloques al panel")
  found: La única prueba del listado en el panel modela "¿Qué casos hay disponibles?" con un tool_end caso:null, sin tool_start y ok:true. El cable real manda caso:"" con ok:false/CASO_NO_ENCONTRADO y un tool_start previo.
  implication: Por qué no se detectó: la prueba codifica una suposición falsa sobre el cable (null en vez de ""), así que pasa en verde mientras el caso real falla.

- timestamp: 2026-10-15T14:28:00Z
  checked: Reproducción con el reductor y los selectores reales del front (scratchpad/repro-caso-vacio.ts, ejecutado con bun desde la raíz del repo)
  found: |
    servidor: casoDeArgumentos({caso:""}) = ""; casoDeArgumentos({}) = null
    cable real caso "": en vivo bloques=[{caso:"", leido:en_curso,...}] marcas=[]; final bloques=[{caso:"", leido:error,...}] marcas=[["",1]]; ruta de archivos=/api/casos//archivos
    control caso null: 0 bloques, 0 marcas en vivo y al final
  implication: Reproduce de forma determinista el bloque fantasma, el Leído en error, la ruta con doble barra y el salto de marca 0→1 que causa el segundo pedido.

- timestamp: 2026-10-15T14:30:00Z
  checked: Ejecución real del bucle del agente con el LLM falso guionado (scratchpad/repro-servidor.test.ts usando tests/helpers/agente-prueba.helper.ts)
  found: '[{"tipo":"tool_start","caso":""},{"tipo":"tool_end","caso":"","ok":false,"codigo":"CASO_NO_ENCONTRADO","resultado":null}]' — 1 pass.
  implication: El servidor emite caso:"" en ambos eventos del listado; src/http/services/sse.service.ts (toSseFrame) lo serializa tal cual. La vista de sesión (vista-sesion.service.ts:71, casoDeArgumentos) da lo mismo al recargar.

- timestamp: 2026-10-15T14:33:00Z
  checked: codegraph callers/impact de casoDeArgumentos y casoDeLlamada; src/config/constants/patterns.constants.ts:3
  found: casoDeArgumentos alimenta ejecutarPaso (eventos SSE), herramientaVista (vista de sesión), casoDeLlamada → resumida (cierre de turno), despacharEnvio y despacharArmado (compuerta), casoConocido (bitácora); 16 símbolos afectados, prueba tests/unit/vista-sesion.service.test.ts. Ya existe PATRON_CASO = ^[a-z0-9-]{1,N}$ (exige longitud ≥ 1).
  implication: Normalizar en casoDeArgumentos con PATRON_CASO limpia todas las superficies de una vez; en la compuerta, simular_envio con "" pasaría a bloquearse con caso null (evento null en vez de BLOQUEADO ""), lo que es inocuo.

- timestamp: 2026-10-15T14:35:00Z
  checked: web/src/config/strings.ts:70-71 (pensandoEn) y 202-205 (anuncio)
  found: Ambos ramifican solo por caso === null; con "" producen "Leyendo la solicitud · …" y "Ejecutando Leer solicitud de " (separador o preposición colgando).
  implication: Efecto cosmético secundario de la misma causa (el "" se trata como caso real en todo el front).

## Resolution

root_cause: "Dos condiciones contribuyentes (AND-gate): (1) el listado de casos diseñado (src/knowledge/registro-proveedor.md:17, D-14: proveedor_leer_solicitud con caso \"\") sale del servidor como caso:\"\" y no como null, porque casoDeArgumentos (src/loop/services/despacho-llamada.service.ts:21, argumentosConCasoSchema = z.object({caso: z.string()})) acepta el string vacío y paso-herramientas.service.ts:54 / vista-sesion.service.ts:71 lo copian a tool_start, tool_end y la vista de sesión; (2) los selectores del panel en web/src/state/casos.ts solo descartan null (plegarTurno L226 `llamada.caso !== null`, casosDelTurno L266 `llamada.caso === null`, plegarPorCaso L81), así que \"\" se registra como un caso con Leído=en_curso→error, queda como el bloque más reciente (abierto), BloqueCaso pinta <h3></h3> y useArchivos llama listarArchivos(\"\") → GET /api/casos//archivos → 404 → 'No pudimos traer los archivos… Reintentar'; el segundo GET sale al cerrar el turno, cuando marcasDeArchivos sube la marca de \"\" de 0 a 1 y re-ejecuta el efecto. No se detectó porque tests/web/progreso.test.ts:284 modela el listado con caso:null (y ok:true, sin tool_start), no con el caso:\"\" real del cable."
fix: ""
verification: ""
files_changed: []
