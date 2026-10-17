---
status: diagnosed
trigger: "G-03-15 (UAT test 15, major): cuando el modelo no está disponible, el chat solo dice en sin_clave que se corra `bun run demo.ts` en local; saldo_agotado, no_disponible y tope_diario no dan camino; en sin_clave el compositor sigue habilitado aunque el aviso dice que el chat no puede procesar mensajes. La usuaria pide una mejor estrategia sin modelo para una analista no técnica."
created: 2026-10-15T14:45:00Z
updated: 2026-10-15T15:15:00Z
goal: find_root_cause_only
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (determinista; brecha de especificación de producto, no de ejecución)
hypothesis: CONFIRMADA. La UI cumple al pie de la letra D-70 + UI-SPEC (banner sin_clave con `bun run demo.ts`, compositor habilitado en todos los estados, sin acción por estado). La brecha nace de D-70, que tomó demo.ts (verificación sin modelo para el evaluador, PRD §6.6) como "el flujo sin modelo" de la analista y redujo LLM-06 a health + aviso, sin diseñar qué puede hacer la persona en cada estado.
next_action: ninguna (goal find_root_cause_only); devolver ROOT CAUSE FOUND con opciones para el planner.

reasoning_checkpoint:
  hypothesis: "La analista recibe un comando de terminal y una entrada habilitada que no lleva a nada porque la decisión D-70 (03-CONTEXT L41) designó demo.ts como camino sin modelo y la UI-SPEC (L202-206, L355) lo fijó como copia literal y como regla 'el compositor sigue habilitado en todos los estados'; ningún artefacto de la fase define, por estado, qué sigue funcionando, a quién avisar ni cuándo vuelve."
  confirming_evidence:
    - "web/src/config/strings.ts L41 y L122-142: COMANDO_DEMO solo en SIN_CLAVE; los otros tres estados sin acción; tests/web/estado-del-modelo.test.ts L32-38 fija esa copia."
    - "web/src/app.tsx L223-232: Compositor bloqueado solo por hidratando; AccionesRapidas solo por enCurso; ninguno lee salud. 03-UI-SPEC L206 lo ordena."
    - "03-CONTEXT D-70 + Deferred Ideas L149 + 03-DISCUSSION-LOG L66-80: 'No hay flujo sin IA en la UI, y para correr sin clave está demo.ts'; el procesar sin IA (DF-15) quedó diferido."
    - "QA T10 + capturas: banner con el comando, 'hola' vuelve con error y el borrador regresa; en saldo el AvisoError dice 'puedes volver a intentarlo' y el banner 'los mensajes van a fallar'."
  falsification_test: "Si algún artefacto de la fase (CONTEXT, UI-SPEC, REQUIREMENTS) definiera acciones por estado o deshabilitara la entrada sin modelo y el código lo ignorara, la causa sería de implementación. No existe: las cuatro fuentes coinciden con el código."
  fix_rationale: "Corregir la especificación (D-70/LLM-06/SC4/UI-SPEC) y luego el front: quitar demo.ts de la UI, copiar por estado qué pasa + qué hacer + cuándo vuelve, y ligar la entrada a la salud solo donde no impida la recuperación. Opcionalmente revertir D-70 con un modo sin modelo de servidor que use solo las herramientas tipadas."
  blind_spots: "No probé en el navegador una variante con el compositor deshabilitado; la trampa de saldo_agotado (no se limpia sin una llamada) está deducida del código de health-report.decorator.ts, no medida. No medí el comportamiento de DeepSeek ante un historial con llamadas a herramientas sintéticas (relevante para la opción a). La copia final debe validarla la usuaria."
  candidate_causes:
    - "spec/decisión: D-70 + LLM-06 + SC4 + UI-SPEC confunden el entregable de verificación del PRD (demo.ts) con el camino de la persona usuaria — CONFIRMADA, causa raíz."
    - "code (front): entrada y chips no consultan la salud; copia de saldo contradictoria entre AvisoError (MENSAJE_AGENTE con conSesionAbierta) y banner — CONFIRMADA, consecuencia directa de la especificación más una incoherencia de copia del servidor."
    - "config/entorno: en Render el respaldo comparte cuenta y clave con el primario, así que no hay conmutación real ante saldo; el tope diario corta todo a propósito — CONFIRMADA como restricción, no como causa."
    - "code (servidor): el envío confirmado necesita que el modelo llame a simular_envio, así que una tarjeta pendiente queda inservible sin modelo — CONFIRMADA, agrava el síntoma."
  and_gate: "Sí, en sentido débil: el síntoma necesita la copia con demo.ts Y la regla de compositor habilitado, pero ambas nacen de la misma decisión D-70; root_cause se expresa como esa decisión más dos agravantes (copia contradictoria de saldo y envío dependiente del modelo)."

## Symptoms

expected: Con el modelo no disponible, una analista no técnica entiende qué pasa y tiene un camino usable; no se le pide correr `bun run demo.ts` en local.
actual: Solo el aviso de sin_clave (AVISO_DEL_MODELO, COMANDO_DEMO en web/src/config/strings.ts) dice "El chat no puede procesar mensajes; para ver el flujo sin modelo, corre `bun run demo.ts` en local."; saldo_agotado, no_disponible y tope_diario no dan camino; en sin_clave el compositor queda habilitado (QA T10, servidor sin clave).
errors: ninguno (brecha de producto/UX, veredicto humano)
reproduction: UAT test 15 (QA T10). Evidencia T10 en .qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md; capturas .qa/evidence/03-chat-web-api-sse-y-despliegue/screenshots/03-test10-*.png
started: Descubierto en UAT (2026-10-15).

## Eliminated

- hypothesis: el compositor queda habilitado en sin_clave por un defecto de implementación (app.tsx olvidó leer la salud).
  evidence: 03-UI-SPEC.md L206 ordena literalmente "El compositor sigue habilitado en todos los estados: el servidor decide y responde con su mensaje (D-70)". El código cumple la especificación.
  timestamp: 2026-10-15T14:50:00Z

- hypothesis: el PRD obliga a que la UI remita a demo.ts cuando no hay modelo.
  evidence: PRD §0 L18 y §6.6 solo exigen que demo.ts exista y corra sin clave, y §9.2 que el README explique cómo correrlo. Ninguna línea pide mencionarlo en la UI ni un modo degradado. La redacción "el flujo sin modelo se corre con demo.ts" es propia (LLM-06 reformulado por D-70, ROADMAP SC4).
  timestamp: 2026-10-15T14:54:00Z

- hypothesis: basta con activar el respaldo de proveedor para cubrir los cuatro estados.
  evidence: withFallback solo cambia ante errores reintentables; el 402 no lo es; en Render el respaldo comparte cuenta y clave con el primario; el tope diario envuelve al respaldo a propósito (D-73.6); sin clave primaria no se crea el agente. El respaldo ya cubre no_disponible y no puede cubrir los otros tres sin una segunda cuenta y cambios de política.
  timestamp: 2026-10-15T15:00:00Z

## Evidence

- timestamp: 2026-10-15T14:47:00Z
  checked: web/src/config/strings.ts (COMANDO_DEMO L41, AVISO_DEL_MODELO L122-142) y web/src/components/aviso-modelo.tsx
  found: solo SIN_CLAVE lleva comando (COMANDO_DEMO = "bun run demo.ts") con el texto "El chat no puede procesar mensajes; para ver el flujo sin modelo, corre … en local."; SALDO_AGOTADO, NO_DISPONIBLE y TOPE_DIARIO usan avisoSinComando (sin camino ni acción). El aviso es un <div role="status"> sin botones.
  implication: la UI no ofrece ninguna acción en ningún estado sin modelo; el único "camino" es un comando de terminal que la analista no puede correr (no tiene el repo ni Bun, y el link es Render).

- timestamp: 2026-10-15T14:48:00Z
  checked: web/src/app.tsx L186 y L215-232; web/src/hooks/usar-salud.ts
  found: AvisoModelo recibe solo salud?.llm; Compositor recibe bloqueado={estado.hidratando} y AccionesRapidas solo enCurso. Ningún componente de entrada consulta la salud. useSalud refresca al cargar, al volver a la pestaña y tras turno fallido (03-17), nunca tras un turno correcto.
  implication: en sin_clave el compositor y los chips quedan habilitados por construcción; cada envío vuelve con un error. No es un bug de implementación: es lo que pide la especificación (ver siguiente entrada).

- timestamp: 2026-10-15T14:50:00Z
  checked: .planning/milestones/v1-phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md L202-206 y L354-358
  found: "El compositor **sigue habilitado** en todos los estados: el servidor decide y responde con su mensaje (D-70: no hay flujo sin IA en la UI)." y la copia del banner sin_clave con `bun run demo.ts` está fijada literalmente en la tabla Copywriting.
  implication: el código cumple la UI-SPEC al pie de la letra; la brecha está en la especificación, no en la ejecución.

- timestamp: 2026-10-15T14:52:00Z
  checked: .planning/milestones/v1-phases/03-chat-web-api-sse-y-despliegue/03-CONTEXT.md D-70 (L41) y Deferred Ideas (L149); REQUIREMENTS.md LLM-06 (L70); ROADMAP.md fase 3 SC4 (L166)
  found: D-70 decidió "El PRD no pide modo degradado … LLM-06 se reduce a health y aviso … No hay flujo sin IA en la UI, y para correr sin clave está demo.ts". El "procesar sin IA" (LLM-06 completo, DF-15, incluido el envío con el botón Confirmar) quedó diferido "si sobra tiempo antes de la defensa". LLM-06 y SC4 quedaron redactados como "El flujo sin modelo se corre con demo.ts" / "sigue disponible con demo.ts". Specifics: la usuaria pidió seguir lo que dicen los requisitos del reto.
  implication: la mención de demo.ts nace de convertir una verificación técnica para el evaluador (PRD §6.6) en el camino de la persona usuaria final. La decisión de producto se tomó mirando cumplimiento del PRD, no la experiencia de la analista.

- timestamp: 2026-10-15T14:54:00Z
  checked: reto-01/PRD.md L11-18, §6.1 (L149-157), §6.6 (L242-248), §8 (L291-300), §9.2-9.3 (L321-328)
  found: demo.ts es un entregable de verificación ("herramientas sin modelo", "Debe correr sin clave de ningún proveedor", README explica cómo correrlo). El PRD no pide modo degradado en la UI ni dice que la UI deba mencionar demo.ts. §8 Robustez: "Timeout al proveedor LLM con mensaje claro". §9.3: "URL pública donde el agente responde … Debe estar activo durante la defensa".
  implication: demo.ts es para el evaluador o el desarrollador, no para la analista. Quitarlo del banner no rompe ningún requisito; un modo sin modelo en la UI tampoco está pedido, pero tampoco prohibido.

- timestamp: 2026-10-15T14:56:00Z
  checked: QA T10 (.qa/evidence/…/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md L207-226) y capturas 03-test10-sin-clave.png y 03-test10-saldo-agotado.png
  found: sin_clave: banner con `bun run demo.ts`, se manda "hola", vuelve el AvisoError "El proveedor del modelo no tiene una clave configurada en el servidor." y el borrador regresa al compositor (habilitado, con chips habilitados). saldo_agotado: AvisoError del turno dice "…La sesión sigue abierta; puedes volver a intentarlo." mientras el banner dice "Los mensajes van a fallar hasta que se recargue la cuenta." (mensajes contradictorios). saldo_agotado y no_disponible solo se conocen después de un turno fallido (health arranca en disponible).
  implication: además de la mención a demo.ts, hay tres fallas de UX: (1) entrada habilitada en un estado sin salida, (2) contradicción entre banner y AvisoError en saldo_agotado ("puedes volver a intentarlo" vs "van a fallar"), (3) ningún estado dice qué puede hacer la analista mientras tanto (avisar a quién, cuándo volver, qué sigue funcionando: archivos ya generados en el panel).

- timestamp: 2026-10-15T15:00:00Z
  checked: src/llm/decorators/fallback.decorator.ts L13-17; src/llm/mappers/provider-error.mapper.ts L29; src/config/constants/llm.constants.ts L47-67; src/config/env.ts resolveFallback (L304-324) y resolveKey (L252-255); render.yaml; PRESET_DEEPSEEK.fallbackModel
  found: el respaldo ya es automático, pero solo tras un error reintentable (limite_tasa, servidor, red, timeout, respuesta_invalida). El 402 (SALDO) y AUTENTICACION no son reintentables, así que nunca cambian de proveedor. En Render solo existe LLM_API_KEY: el respaldo por defecto es deepseek-v4-pro sobre la misma URL y hereda la misma clave, es decir, la misma cuenta prepagada. withDailyBudget envuelve a withFallback (agente.wiring L119; D-73.6 "incluido el fallback"). Sin LLM_API_KEY, crearAgente devuelve PROVEEDOR_SIN_CLAVE aunque exista una clave de respaldo.
  implication: la opción (b) "cambiar al respaldo" ya cubre no_disponible y no puede cubrir saldo_agotado (misma cuenta), tope_diario (corte global por diseño) ni sin_clave (no hay agente). Solo aportaría con una segunda cuenta de otro proveedor (nuevo secreto, nuevo costo, nuevas capacidades por probar) y cambiando withFallback para que cambie también con SALDO/AUTENTICACION.

- timestamp: 2026-10-15T15:03:00Z
  checked: src/loop/services/ejecutar-turno.service.ts decisionDe (L52-61) y src/loop/services/despacho-llamada.service.ts despacharEnvio; src/http/routes/chat.route.ts L158-159
  found: la accion confirmar (D-68) solo cambia la decisión de la compuerta; el envío ocurre cuando el MODELO llama a proveedor_simular_envio y el servidor reescribe los argumentos con confirmado:true desde la autorización. Con tope_diario el chat responde 429 antes de abrir el turno; con saldo_agotado el turno falla y el caso vuelve a pendiente (D-63.2/D-63.6).
  implication: con el modelo caído, una tarjeta de confirmación abierta no se puede completar: la analista queda con un paquete armado y un botón Confirmar que no funciona hasta que vuelva el modelo. Ningún mensaje lo explica.

- timestamp: 2026-10-15T15:05:00Z
  checked: src/demo/runners/ejecutar-demo.runner.ts (procesarCaso L148-182, correrCasos L216-232, ejecutarDemo L235-249); src/loop/services/conversacion-turno.service.ts (resolverTurno/conversar) y paso-herramientas.service.ts (darPaso, ejecutarPaso)
  found: la cadena determinista de un caso cabe en ~25 líneas (leer → mapear → generar con el mapeo proyectado de mapear_campos → armar → simular_envio confirmado:false). Pero ejecutarDemo borra out/ completo (rm OUT_DIR) y fija la fecha mutando el entorno global (pinExecutionDate): no se puede llamar desde el servidor multi-sesión. El bucle ya separa "decidir llamadas" (deps.llm.enviar) de "ejecutarlas" (darPaso con LlamadaHerramienta): un resolutor sin modelo podría alimentar darPaso con llamadas sintéticas y obtener los mismos tool_start/tool_end, la compuerta, el log CA4, el historial y la vista de recarga. La TarjetaResultado y el panel se pliegan solo de tool_end (03-21, 03-22), nunca del texto del modelo.
  implication: la opción (a) es técnicamente viable sin tocar las herramientas y sin texto generado, pero no reutilizando ejecutarDemo; exige un resolutor nuevo en loop y crear el agente sin clave.

- timestamp: 2026-10-15T15:07:00Z
  checked: src/http/wiring/server.wiring.ts L212-247; src/http/routes/health.route.ts L20; tests/http/salud.test.ts L135-170; tests/web/estado-del-modelo.test.ts L31-38; .planning/research/FEATURES.md DF-15 (L112); 03-DISCUSSION-LOG.md L66-80
  found: sin clave el servidor arranca con agente null: health deriva sin_clave de agente === null, chat responde 503, sesiones 404; las rutas de artefactos sí funcionan sin agente. La prueba web fija el texto con `bun run demo.ts`. La investigación original (DF-15) describía el modo sin LLM como "seguro de vida para la defensa: el link funciona aunque DeepSeek falle", con la advertencia "declararlo de forma explícita para que no parezca truco"; en la discusión la usuaria preguntó qué pide el PRD y se eligió "reducirlo a health + aviso".
  implication: el modo (a) obliga a cambiar el contrato de creación del agente (agente sin LLM), la derivación de sin_clave, la ruta de chat y sus pruebas (salud.test.ts, topes.test.ts). Las opciones (b-mensajes) y (c) solo tocan strings y app.tsx en el front, y estado-del-modelo.test.ts.

- timestamp: 2026-10-15T15:09:00Z
  checked: src/llm/decorators/health-report.decorator.ts L15-27 y agente.wiring estadoDelModelo (L122-124); createDailyBudget.rollOver
  found: saldo_agotado y no_disponible solo se limpian cuando una llamada al modelo vuelve a funcionar (health nunca llama al LLM, D-71). tope_diario se limpia solo con el cambio de día (exhausted() hace rollOver).
  implication: trampa de diseño para la opción (c): si se deshabilita el compositor en saldo_agotado, nadie vuelve a llamar al modelo y el estado no se limpia nunca después de la recarga (solo con un reinicio). Deshabilitar es seguro en sin_clave (permanente hasta redeploy) y en tope_diario (se recupera solo); en saldo_agotado y no_disponible el reintento debe seguir posible.

## Resolution

root_cause: "Brecha de especificación, no de implementación. D-70 (03-CONTEXT) redujo LLM-06 a health + aviso y nombró demo.ts, que el PRD pide como verificación sin modelo para el evaluador (§6.6), como el 'flujo sin modelo' de la analista. Esa decisión pasó literal a REQUIREMENTS LLM-06, ROADMAP SC4 y la UI-SPEC: la copia del banner sin_clave con `bun run demo.ts` y la regla 'el compositor sigue habilitado en todos los estados'. El front la cumple al pie de la letra (strings.ts AVISO_DEL_MODELO, app.tsx Compositor y AccionesRapidas sin leer la salud). Ningún artefacto definió, por estado, qué sigue funcionando, a quién avisar ni cuándo vuelve. Agravantes: (1) en saldo_agotado el AvisoError del turno dice 'puedes volver a intentarlo' mientras el banner dice que los mensajes van a fallar; (2) el envío confirmado depende de que el modelo llame a simular_envio, así que sin modelo una tarjeta de confirmación abierta no se puede completar; (3) en Render el respaldo comparte cuenta con el primario y el tope diario lo envuelve, así que no hay conmutación real fuera de no_disponible; (4) AUTENTICACION se publica como no_disponible ('no respondió en el último intento') aunque una clave inválida no se recupera sola."
fix: "(no aplica: goal find_root_cause_only). Ver Suggested Fix Direction en el retorno: opción C+ (copia por estado + entrada ligada a la salud donde no bloquee la recuperación) como cierre de la brecha en la fase 3; opción A (modo sin modelo de servidor, solo herramientas tipadas, compuerta intacta) como decisión explícita de la usuaria que revierte D-70; opción B (conmutación de proveedor) solo si se financia una segunda cuenta."
verification: ""
files_changed: []
