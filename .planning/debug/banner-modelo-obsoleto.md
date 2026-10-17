---
status: diagnosed
trigger: "G-03-14 (UAT test 14, también referido por test 15; severidad minor): el punto de estado del modelo en el encabezado y el banner AvisoModelo solo se refrescan tras un turno fallido o al volver el foco a la pestaña; tras un 500, una respuesta correcta posterior sigue mostrando 'No disponible'; con AGENT_DAILY_TOKEN_BUDGET=1 el turno que cruzó el tope siguió mostrando 'Disponible' hasta la siguiente acción."
created: 2026-10-15T15:30:00Z
updated: 2026-10-15T15:55:00Z
goal: find_root_cause_only
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (determinista: se reproduce siempre que un turno correcto cambia el estado del modelo)
hypothesis: CONFIRMADA. La causa está solo en el disparador del front. El servidor ya cambia el estado en el momento correcto (disponible tras una llamada correcta; tope_diario en cuanto se registran los tokens que cruzan el tope), pero useSalud solo vuelve a pedir /api/health al montar, en visibilitychange→visible y cuando useChat reporta un turno fallido. Un turno correcto nunca dispara el refresco. Esa regla viene escrita en la UI-SPEC L203 y en el plan 03-17, y la prueba tests/web/conversacion.test.ts L638 la fija.
next_action: ninguna (goal find_root_cause_only); devolver ROOT CAUSE FOUND.

reasoning_checkpoint:
  hypothesis: "El banner y el punto quedan obsoletos un turno porque usar-chat.ts L85-88 solo llama a refrescar (alFallarTurno) cuando esFalloDeTurno vio un error, un rechazo HTTP distinto de 401, la red caída o el stream cortado. Las dos transiciones que ocurren en un turno correcto (no_disponible/saldo_agotado→disponible y disponible→tope_diario) quedan fuera del disparador, aunque /api/health ya las refleja."
  confirming_evidence:
    - "web/src/hooks/usar-chat.ts L69-88: turnoFallido solo pasa a true por esFalloDeTurno; el finally llama a alFallarTurno solo si turnoFallido. web/src/state/conversacion.ts L334-346: EVENTO solo cuenta si es error; FIN_TURNO, USO y TEXTO caen en default→false."
    - "web/src/hooks/usar-salud.ts: refrescar solo se llama al montar y en visibilitychange con visibilityState==='visible'; no hay sondeo ni ningún otro llamador (codegraph callers refrescar / esFalloDeTurno)."
    - "QA T09: tras el turno correcto posterior al 500, /api/health ya decía llm=disponible mientras el encabezado seguía en 'No disponible'; un visibilitychange lo limpió. QA T10 puerto 3042: tras el primer turno correcto health ya decía tope_diario y el encabezado seguía en 'Disponible'."
    - "tests/http/salud.test.ts L103-119 y tests/http/topes.test.ts L178-212 (pasan, 55/55): health vuelve a disponible justo después de un turno correcto y reporta tope_diario justo después del turno correcto que cruzó el tope."
    - "03-UI-SPEC.md L203 y 03-17-PLAN.md L33/L91: 'después de cada turn_end que trajo un evento error'; tests/web/conversacion.test.ts L638 'un turno sin error no pide refrescar health' fija ese comportamiento."
  falsification_test: "Si /api/health siguiera devolviendo no_disponible (o disponible en el caso del tope) justo después del turno correcto, la causa estaría en el servidor. Las pruebas de integración y la medición de QA muestran lo contrario: el servidor ya está al día y solo el front no pregunta."
  fix_rationale: "Pedir health al cerrar cada turno (no solo los fallidos) hace que la UI lea el estado que el servidor ya calculó, que es la fuente de verdad (D-71). Ataca la causa (el disparador incompleto) y no un síntoma. Health es barato, nunca llama al LLM, no cuenta para el rate limit y el servidor ya está despierto durante el turno, así que no rompe la regla 'sin sondeo' de la UI-SPEC."
  blind_spots: "No medí en el navegador una variante con el refresco incondicional (no se toca código en este modo). No verifiqué si algún navegador dispara visibilitychange al cambiar de ventana sin ocultar la pestaña; el disparador real es visibilitychange, no window focus, así que en escritorio con dos ventanas visibles puede no dispararse. El estado del monitor es global (todas las sesiones): con varias analistas el banner refleja la última llamada de cualquiera, por diseño."
  candidate_causes:
    - "code (front): disparador de useSalud limitado a turnos fallidos (usar-chat.ts finally + esFalloDeTurno) — CONFIRMADA, causa raíz."
    - "spec/decisión: la UI-SPEC L203 y el plan 03-17 definieron 'solo tras turn_end con error' asumiendo que el estado del modelo solo cambia por errores — CONFIRMADA, origen de la regla del código."
    - "code (servidor): health-report no publica disponible en el éxito o daily-budget publica tope_diario recién en la llamada siguiente — ELIMINADA (ver Eliminated)."
    - "config/entorno (caché HTTP): el navegador sirve un /api/health cacheado — ELIMINADA (sin validadores ni Cache-Control de frescura; QA vio la respuesta nueva en cada fetch)."
  and_gate: "No. Basta una condición: el front no pide health tras un turno correcto. El servidor ya tiene el estado correcto en ese instante, así que no hay una segunda causa que tenga que coincidir."

## Symptoms

expected: Tras un error del proveedor (p. ej. 500 → no_disponible), un turno correcto posterior limpia el banner; un turno que agota el presupuesto diario muestra tope_diario justo después.
actual: (QA T09/T10) el estado solo se refresca tras un turno fallido o cuando la pestaña recupera el foco. Tras un 500, una respuesta correcta siguiente seguía mostrando 'No disponible'; en un servidor con AGENT_DAILY_TOKEN_BUDGET=1 el turno que llegó al tope siguió mostrando 'Disponible' hasta la siguiente acción.
errors: ninguno (estado de UI obsoleto)
reproduction: UAT test 14 (QA T09/T10). Evidencia T09/T10 en .qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md; captura 03-test09-banner-obsoleto-tras-exito.png.
started: Descubierto en UAT (2026-10-15).

## Eliminated

- hypothesis: el decorador health-report no publica disponible cuando una llamada vuelve a funcionar, así que el servidor sigue diciendo no_disponible.
  evidence: src/llm/decorators/health-report.decorator.ts L15-27 publica ESTADO_LLM.DISPONIBLE con result.ok (solo se abstiene si la llamada se abortó). tests/http/salud.test.ts L103-119 (pasa) recorre saldo_agotado → turno correcto → health disponible. QA T09 midió /api/health=disponible mientras la UI seguía en 'No disponible'.
  timestamp: 2026-10-15T15:40:00Z

- hypothesis: el tope diario solo se publica en el pedido siguiente (cuando withDailyBudget rechaza), no en el momento en que se cruza.
  evidence: estadoDelModelo (src/loop/wiring/agente.wiring.ts L122-124) se calcula en cada GET /api/health con presupuestoDiario.exhausted(), y withDailyBudget (daily-budget.decorator.ts L41) hace budget.record al terminar la llamada correcta. El cruce queda visible en cuanto termina la llamada, antes de turn_end. tests/http/topes.test.ts L178-192 y L201-212 (pasan) leen tope_diario justo después del turno correcto que cruzó el tope. QA T10/3042 vio health=tope_diario con el encabezado en 'Disponible'.
  timestamp: 2026-10-15T15:42:00Z

- hypothesis: el navegador cachea GET /api/health y por eso el refresco no ve el estado nuevo.
  evidence: la ruta (src/http/routes/health.route.ts) responde c.json sin Last-Modified ni ETag, así que no hay frescura heurística. En T09 un visibilitychange sí trajo el estado nuevo. El problema es que no se pide, no que se pida y llegue viejo.
  timestamp: 2026-10-15T15:43:00Z

## Evidence

- timestamp: 2026-10-15T15:32:00Z
  checked: base de conocimiento (.planning/debug/knowledge-base.md) y sesión relacionada estrategia-sin-modelo.md
  found: no existe knowledge-base.md ni resolved/. La sesión estrategia-sin-modelo (Evidence 14:48) ya notó que useSalud nunca refresca tras un turno correcto, sin analizar el servidor.
  implication: no hay patrón conocido; se parte de ese hallazgo y se confirma el lado servidor.

- timestamp: 2026-10-15T15:34:00Z
  checked: web/src/hooks/usar-salud.ts completo; codegraph callers refrescar / useSalud
  found: refrescar se llama solo en el useEffect de montaje y en alVolverALaPestana (document 'visibilitychange' con visibilityState === 'visible'). Además se expone a App, que lo pasa a useChat como alFallarTurno. No hay setInterval. El disparador de "foco" es visibilitychange, no window focus.
  implication: conjunto exacto de disparadores: (1) montaje, (2) la pestaña pasa a visible, (3) turno fallido. Ninguno cubre un turno correcto.

- timestamp: 2026-10-15T15:36:00Z
  checked: web/src/hooks/usar-chat.ts L64-89 y web/src/state/conversacion.ts L334-346 (esFalloDeTurno); web/src/api/flujo-chat.ts
  found: turnoFallido = true solo si esFalloDeTurno(accion): EVENTO de tipo error, ERROR_HTTP con status ≠ 401, ERROR_RED o FIN_STREAM (FIN_STREAM solo se despacha si el stream terminó sin turn_end). El finally llama a alFallarTurno solo si turnoFallido. Con Detener, despacharDelTurno descarta todo tras el abort, así que tampoco refresca. Los eventos usage y turn_end de un turno correcto no marcan nada.
  implication: tras un turno correcto la UI conserva el último health leído, aunque el servidor haya cambiado de estado durante ese turno.

- timestamp: 2026-10-15T15:38:00Z
  checked: src/llm/decorators/health-report.decorator.ts; src/llm/decorators/daily-budget.decorator.ts; src/loop/wiring/agente.wiring.ts modeloDelAgente (L114-120) y estadoDelModelo (L122-124); src/http/routes/health.route.ts
  found: composición withDailyBudget(withHealthReport(withFallback(primario, respaldo)), presupuesto). withHealthReport publica DISPONIBLE con result.ok y ESTADO_LLM_TRAS_ERROR[tipo] en error (sin publicar si se abortó). withDailyBudget suma tokens con record al terminar cada llamada correcta. Health calcula llm en cada GET como exhausted() ? tope_diario : monitor.current(). turn_end y usage no llevan el estado del modelo (src/loop/types/evento.type.ts L54-75).
  implication: el servidor cambia de estado en el instante correcto, ambas transiciones ocurren dentro de la última llamada del turno (antes de turn_end), y health las expone sin retraso. El servidor no tiene defecto. El estado del modelo solo llega al front por /api/health.

- timestamp: 2026-10-15T15:44:00Z
  checked: bun test tests/http/salud.test.ts tests/http/topes.test.ts tests/unit/health-report.decorator.test.ts tests/unit/daily-budget.decorator.test.ts
  found: 55 pass, 0 fail. Incluye "vuelve a disponible tras una llamada exitosa" (salud L103), "después de un turno que agota el tope … health reporta tope_diario" (topes L178) y "los tokens del modelo de respaldo también cuentan para el tope" (topes L201).
  implication: observación directa y repetible de que el servidor publica las dos transiciones en cuanto termina el turno correcto.

- timestamp: 2026-10-15T15:46:00Z
  checked: QA T09/T10 (.qa/evidence/…/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md L186-224) y captura 03-test09-banner-obsoleto-tras-exito.png
  found: T09: después de 'QA-500' el encabezado pasó a 'No disponible' (turno fallido → refresco). En el turno correcto siguiente la respuesta del LLM falso se pinta bajo el banner 'no respondió en el último intento' mientras /api/health ya decía disponible, y un visibilitychange lo limpió. T10/3042 (tope=1): el primer turno es correcto y health pasa a tope_diario, pero el encabezado sigue en 'Disponible'. El segundo turno recibe el 429, que cuenta como fallido, y recién ahí se ve 'Tope diario'.
  implication: el síntoma calza exactamente con el conjunto de disparadores del front. El retraso es siempre de un turno, o hasta que la pestaña se oculta y vuelve.

- timestamp: 2026-10-15T15:48:00Z
  checked: 03-UI-SPEC.md L203; 03-17-PLAN.md L33, L39-47, L91, L166; 03-17-SUMMARY.md L12, L58-59; tests/web/conversacion.test.ts L626-655 (5/5 pasan)
  found: la UI-SPEC dice "Se consulta al cargar la app, al volver el foco a la pestaña (visibilitychange) y después de cada turn_end que trajo un evento error. Sin sondeo por intervalo". El plan 03-17 repite la regla y la prueba "un turno sin error no pide refrescar health" la fija.
  implication: el código cumple la especificación. La regla supuso que el estado del modelo solo cambia por errores y pasó por alto dos transiciones que ocurren en turnos correctos: la recuperación (→disponible) y el cruce del tope diario (→tope_diario).

- timestamp: 2026-10-15T15:50:00Z
  checked: costo de pedir health en cada turno: tests/http/topes.test.ts L294 y L586; CONTEXT D-71 y L73
  found: /api/health es público, nunca llama al LLM y no cuenta para el rate limit de mensajes. Durante un turno el servicio de Render ya está despierto.
  implication: un GET /api/health por turno no gasta tokens ni cupo y no es sondeo, así que respeta la restricción "sin sondeo por intervalo" de la UI-SPEC.

## Resolution

root_cause: "Disparador incompleto en el front, nacido de la especificación. useSalud (web/src/hooks/usar-salud.ts) solo pide /api/health al montar, cuando la pestaña vuelve a estar visible (visibilitychange) y cuando useChat reporta un turno fallido (web/src/hooks/usar-chat.ts L85-88, condicionado por esFalloDeTurno en web/src/state/conversacion.ts L334-346). La UI-SPEC L203 y el plan 03-17 definieron 'después de cada turn_end que trajo un evento error', suponiendo que el estado del modelo solo cambia por errores. Dos transiciones ocurren en turnos correctos: no_disponible/saldo_agotado→disponible (withHealthReport publica DISPONIBLE con result.ok) y disponible→tope_diario (withDailyBudget hace record de la llamada que cruza el tope y estadoDelModelo lo lee en cada GET). El servidor las expone de inmediato (salud.test.ts L103, topes.test.ts L178/L201; QA midió health ya actualizado). El front no vuelve a preguntar y queda un turno atrasado. No hay defecto en el servidor."
fix: "(no aplica: goal find_root_cause_only). Dirección mínima: pedir health al cerrar CADA turno. En usar-chat.ts el finally llama al callback sin condición (renombrar alFallarTurno → alTerminarTurno), con lo que esFalloDeTurno queda sin uso y se puede borrar. Actualizar tests/web/conversacion.test.ts L626-655 y corregir la UI-SPEC L203 (y la nota del 03-17) a 'al cargar, en visibilitychange y después de cada turn_end o rechazo del chat'. Alternativa más invasiva y no recomendada: agregar llm a turn_end/usage, lo que obliga a que el loop conozca el monitor (DependenciasTurno), cambia el contrato SSE y JSON, y aun así haría falta health para sin_clave y el 429 previo al turno."
verification: ""
files_changed: []
