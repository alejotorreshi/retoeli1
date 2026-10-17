---
status: diagnosed
trigger: "G-03-10 (UAT test 10, minor): WR-06 — la vista previa 422 (existe pero no tiene vista previa) muestra en el navegador TEXTO_VISTA_PREVIA.error con la pista de reinicio, igual que un 404"
created: 2026-10-15T14:10:00Z
updated: 2026-10-15T14:32:00Z
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (determinista: toda respuesta 422 sigue el mismo camino de código)
hypothesis: CONFIRMADA. El cliente conserva el 422 y su `mensaje` (RECHAZO {status, mensaje}), pero DialogoVistaPrevia lo descarta al pasar a VISTA_CON_ERROR, una variante de EstadoVistaPrevia sin mensaje ni causa, y siempre pinta la constante TEXTO_VISTA_PREVIA.error, que lleva la pista de reinicio. El fix WR-06 (8526c8a) no tocó ningún archivo de web/src.
test: reproducción en el scratchpad con fetch simulado (422 con el cuerpo real del servidor) aplicando la misma rama del efecto del diálogo
expecting: (cumplido) RECHAZO 422 con el mensaje del servidor; esArchivoNoEncontrado = false; estado { tipo: "error" } sin mensaje; texto pintado con "Si el servidor se reinició"
next_action: devolver ROOT CAUSE FOUND (goal: find_root_cause_only). No se aplica ningún fix.

reasoning_checkpoint:
  hypothesis: "El diálogo muestra la pista de reinicio en un 422 porque su efecto (dialogo-vista-previa.tsx:96-107) reduce todo resultado no-OK a VISTA_CON_ERROR = { tipo: ERROR }, que no lleva ni el status ni el mensaje, y el JSX (líneas 125-129) pinta siempre TEXTO_VISTA_PREVIA.error."
  confirming_evidence:
    - "Reproducción: obtenerVistaPrevia ante un 422 devuelve { tipo: 'rechazo', status: 422, mensaje: 'Este archivo no tiene vista previa. Puedes descargarlo para revisarlo.' }; tras la rama del diálogo el estado es { tipo: 'error' } y el texto pintado es TEXTO_VISTA_PREVIA.error, con pistaReinicio = true y mensajeDelServidorVisible = false."
    - "EstadoVistaPrevia (web/src/types/chat.type.ts:356-359): la variante ERROR no tiene campos, así que el mensaje 422 no puede llegar al render."
    - "git show --stat 8526c8a: 10 archivos, ninguno en web/src; solo cambió MENSAJE_HTTP.vistaPreviaNoDisponible del servidor y se añadió la aserción de esArchivoNoEncontrado(422) = false."
  falsification_test: "Si algún camino del diálogo leyera resultado.mensaje o resultado.status para elegir el texto, o si TEXTO_VISTA_PREVIA.error no tuviera la pista, la reproducción mostraría mensajeDelServidorVisible = true o pistaReinicio = false. No pasó."
  fix_rationale: "(solo dirección; goal find_root_cause_only) Llevar la causa al estado del diálogo (p. ej. ERROR con mensaje, o variantes NO_DISPONIBLE / NO_ENCONTRADO / FALLO) y pintar para el 422 el mensaje del servidor o un texto nuevo de strings.ts sin pista de reinicio; la pista queda solo para el 404."
  blind_spots: "No se confirmó en un navegador real (sin DOM en las pruebas; el runner B no lo verificó). La reproducción copia la rama del efecto en vez de montar el componente, aunque el código es idéntico y trivial."
  candidate_causes:
    - "code: el diálogo colapsa todo error en una constante y descarta status/mensaje (CONFIRMADA)"
    - "config/spec: 03-UI-SPEC.md:343 define un único texto de 'Vista previa: error' (con la pista), anterior a WR-06; nadie añadió la fila para 422"
    - "code (servidor): el 422 lleva la pista de reinicio en su cuerpo (DESCARTADA: el cuerpo real es el texto nuevo sin pista)"
  and_gate: "no como condiciones de ejecución: basta la rama del diálogo para producir el síntoma. El UI-SPEC con un solo texto y el alcance del fix WR-06 (solo servidor + predicado de 404) explican por qué no se detectó, no son causas en tiempo de ejecución."

## Symptoms

expected: En el navegador, abrir la vista previa de un archivo sin vista previa (un soporte, o un formulario cuyo mapeo.json falta o no se puede leer) muestra el mensaje 422 del servidor, sin "Si el servidor se reinició, vuelve a procesar el caso".
actual: La API responde 404/422 correctamente (WR-06), pero web/src/components/dialogo-vista-previa.tsx muestra TEXTO_VISTA_PREVIA.error (con la pista de reinicio) para toda respuesta no-OK, incluido el 422, e ignora el mensaje del servidor. El runner B no lo confirmó por separado en el navegador.
errors: ninguno (comportamiento de UI incorrecto)
reproduction: UAT test 10 (QA T05). Evidencia T05 en .qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md. Intención del fix: 03-REVIEW-FIX.md (sección WR-06); prueba "un 422 no marca disco borrado" en tests/web/archivos.test.ts.
started: tras el fix WR-06 (8526c8a), que solo cubrió el servidor y el marcado de disco borrado

## Eliminated

- hypothesis: el cuerpo 422 del servidor todavía trae la pista de reinicio
  evidence: artifacts.route.ts:55-57 responde { mensaje: MENSAJE_HTTP.vistaPreviaNoDisponible } = "Este archivo no tiene vista previa. Puedes descargarlo para revisarlo." (8526c8a quitó la pista); QA T05 lo vio así en el cable.
  timestamp: 2026-10-15T14:18:00Z

- hypothesis: el cliente HTTP pierde el 422 (lo convierte en SIN_RED o en 404) antes de llegar al diálogo
  evidence: resultadoDelRechazo (cliente-api.ts) devuelve { tipo: RECHAZO, status: 422, mensaje } porque el cuerpo trae un mensaje no vacío; la reproducción lo imprime tal cual. esArchivoNoEncontrado devuelve false para 422, así que tampoco se marca disco borrado.
  timestamp: 2026-10-15T14:25:00Z

## Evidence

- timestamp: 2026-10-15T14:12:00Z
  checked: base de conocimiento (.planning/debug/knowledge-base.md)
  found: no existe; MemPalace no se consultó. Sin patrón conocido.
  implication: investigación abierta.

- timestamp: 2026-10-15T14:15:00Z
  checked: web/src/components/dialogo-vista-previa.tsx (efecto 94-108 y JSX 120-130)
  found: ante un resultado no-OK, el efecto llama alVencerAcceso si es 401, alNoEncontrado si esArchivoNoEncontrado (solo 404) y después, siempre, setEstado(VISTA_CON_ERROR). VISTA_CON_ERROR = { tipo: ESTADO_VISTA_PREVIA.ERROR } (línea 24). El JSX pinta {TEXTO_VISTA_PREVIA.error} para ERROR, sin mirar status ni mensaje.
  implication: 404, 422, 500 y fallo de red producen el mismo texto; el mensaje del servidor se pierde.

- timestamp: 2026-10-15T14:16:00Z
  checked: web/src/types/chat.type.ts:356-359 y web/src/config/constants/ui.constants.ts:234-238
  found: EstadoVistaPrevia tiene tres variantes (CARGANDO, ERROR, LISTA); ERROR no lleva datos. ESTADO_VISTA_PREVIA no tiene un estado "sin vista previa".
  implication: el tipo hace imposible mostrar el texto 422; el arreglo necesita ampliar el tipo o el estado.

- timestamp: 2026-10-15T14:17:00Z
  checked: web/src/config/strings.ts:319-329 y 03-UI-SPEC.md:343
  found: TEXTO_VISTA_PREVIA.error = "No se pudo cargar la vista previa. Si el servidor se reinició, vuelve a procesar el caso; si no, inténtalo de nuevo." Es el único texto de error de la vista previa, fijado por el UI-SPEC antes de WR-06 y por la prueba tests/web/archivos.test.ts:404.
  implication: no existe en el front un texto para "existe pero no tiene vista previa".

- timestamp: 2026-10-15T14:19:00Z
  checked: git show --stat 8526c8a (fix WR-06) y su diff de src/config/strings.ts y tests/web/archivos.test.ts
  found: el commit toca 10 archivos y ninguno de web/src. En el front solo añadió una aserción de que esArchivoNoEncontrado(422) = false. 03-REVIEW-FIX.md dice "El cliente ya marcaba 'disco borrado' solo con un 404": se verificó el marcado de disco, no el texto del diálogo. dialogo-vista-previa.tsx no cambia desde f35bb08 (03-27).
  implication: el alcance del fix dejó el texto del diálogo sin revisar; la prueba añadida no cubre lo que el usuario ve.

- timestamp: 2026-10-15T14:22:00Z
  checked: src/http/routes/artifacts.route.ts y src/infra/output/artifact-reader.adapter.ts
  found: 404 solo si findArtifact no encuentra el archivo; 422 con vistaPreviaNoDisponible si existe pero previewOf devuelve null (soporte; formulario/valores_portal sin mapeo.json legible o válido para mapeoGuardadoSchema; texto que desaparece entre findArtifact y la lectura).
  implication: el servidor cumple WR-06; el defecto es solo de la UI.

- timestamp: 2026-10-15T14:24:00Z
  checked: caminos reales de la UI que llegan a un 422 (lista-archivos.tsx:22, isPreviewable en artifact-reader.adapter.ts, generar-formulario.use-case.ts, output-files.adapter.ts)
  found: el botón Ver solo se pinta si archivo.previsualizable, que es false para SOPORTE, así que un soporte no llega al 422 desde la UI (solo por la API directa). Llegan formulario.xlsx/.pdf o valores-portal cuando mapeo.json falta o no se puede leer o validar: (a) generar_formulario escribe el formulario antes que mapeo.json (cerrar() → escribirMapeo), (b) writeFile no es atómico, así que un reproceso que reescribe mapeo.json deja una ventana con JSON truncado, (c) mapeo.json corrupto o de un esquema anterior. clearPreviousArtifacts no borra mapeo.json (no está en ARCHIVOS_REGENERABLES), y una pérdida de disco borra todo out/, así que esa ruta da 404, no 422.
  implication: en la UI el 422 es raro y de ventana corta (coherente con severidad minor), pero cuando llega el texto es incorrecto de forma determinista.

- timestamp: 2026-10-15T14:28:00Z
  checked: reproducción en el scratchpad (repro422/repro.ts con tsconfig de alias absolutos; fetch simulado con el cuerpo real de MENSAJE_HTTP) que aplica la rama del efecto del diálogo
  found: 422 → resultado { tipo: "rechazo", status: 422, mensaje: "Este archivo no tiene vista previa. Puedes descargarlo para revisarlo." }, marcoBorrado false, estado { tipo: "error" }, texto pintado = TEXTO_VISTA_PREVIA.error, pistaReinicio true, mensajeDelServidorVisible false. 404 → mismo texto, marcoBorrado true (correcto).
  implication: confirmado: el mensaje 422 llega intacto al diálogo y el diálogo lo descarta.

## Resolution

root_cause: DialogoVistaPrevia (web/src/components/dialogo-vista-previa.tsx:96-107 y 125-129) reduce todo resultado no-OK de obtenerVistaPrevia a VISTA_CON_ERROR = { tipo: ERROR }, una variante de EstadoVistaPrevia (web/src/types/chat.type.ts:358) sin status ni mensaje, y pinta siempre la constante TEXTO_VISTA_PREVIA.error (web/src/config/strings.ts:325-326), que lleva "Si el servidor se reinició, vuelve a procesar el caso". El 422 { status: 422, mensaje: vistaPreviaNoDisponible } llega intacto al diálogo, que lo descarta. El fix WR-06 (8526c8a) se quedó en el servidor y en el predicado esArchivoNoEncontrado y no tocó web/src; el UI-SPEC (03-UI-SPEC.md:343) solo define un texto de error de vista previa.
fix: (no aplicado; goal find_root_cause_only)
verification: (no aplica)
files_changed: []
