---
status: testing
phase: 03-chat-web-api-sse-y-despliegue
source: [03-VERIFICATION.md, 03-03..03-27-SUMMARY.md (coverage present[]), 03-REVIEW-FIX.md (WR-05, IN-03, WR-06, WR-07), regression_scan]
started: 2026-10-15T06:12:32Z
updated: 2026-10-15T14:01:29Z
---

## Current Test

number: 2
name: Health checks de Render durante un turno SSE largo
expected: |
  En Render → Events/Logs los health checks siguen pasando y no hay reinicio durante la ventana de T20 (2026-10-15T13:38:40Z → 13:40:36Z); el humano lo revisa al final, desde el computador.
awaiting: user response

## Tests

### 1. Publicar la UI de la fase en el link público y recorrerla con el modelo real
expected: El bundle publicado trae la UI completa de la fase; cada paso se ve como en las capturas locales (.playwright-mcp/03-*.png); el SSE sigue llegando por trozos; "¿Qué casos hay?" no termina en tarjeta de error.
result: pass

### 2. Health checks de Render durante un turno SSE largo
expected: En Render → Events/Logs los health checks siguen pasando y no hay reinicio mientras corre el stream.
result: [pending]

### 3. Misma sesión en dos pestañas
expected: La segunda pestaña muestra el aviso de sesión ocupada y sigue usable; tras recargar, ambas muestran el mismo historial.
result: pass

### 4. Demo "Procesar los 4 casos" a 1280×720 y 375×667
expected: Línea de tiempo, panel y diálogo con scroll propio; encabezado y compositor fijos; argumentos largos y vistas .md con alto máximo y scroll, sin desbordar; observar el auto-scroll tras más de 6 llamadas.
result: issue
reported: "QA T16 (accepted by human as no-pass minor): at 375×667, after >6 tool calls auto-scroll leaves an old message visible until 'Ir al final' is pressed, and that button overlaps text; the 5 new sessions/hour cap (429) can surface during the defense when 'Nueva sesión' is clicked repeatedly"
severity: minor

### 5. El envío simulado no se presenta como un correo real
expected: La tarjeta y el resultado dicen "Envío simulado" y "Confirmar registra solo ENVIO-SIMULADO.md. No se envía ningún correo real."; nada sugiere un correo real.
result: pass

### 6. bun run dev desde un clon limpio en menos de 2 minutos
expected: Health por el proxy de Vite en menos de 120 s.
result: pass

### 7. Contrato HTTP en socket real: health, acceso, 401, bordes y topes
expected: health 200 {ok,provider,model,llm} with no key/secret fields; each protected route 401 without access, JSON Spanish message; acceso right code 204 + Set-Cookie HttpOnly; SameSite; Path=/api; 413 for 2001 chars and oversize body; 415 for non-JSON; 429 with clear Spanish message after the per-minute limit; security headers present (nosniff, frame deny/CSP if implemented)
result: pass
note: "Low follow-ups: XFF spoof evades limits with TRUSTED_PROXY_HOPS=1 when exposed directly; 401/429 not logged; no Retry-After on 429; 401 says 'Tu acceso venció' to a never-logged-in client"

### 8. SSE local: llega por trozos, latido, fallback JSON y aborto
expected: Content-Type text/event-stream; Cache-Control no-cache, no-transform; turn_start arrives seconds before turn_end; >= 4 tool_start/tool_end pairs arrive progressively; ': ping' heartbeat during the 4 s waits (if heartbeat < wait); JSON variant returns {reply, toolCalls[], needsConfirmation}; after abort the session is reusable (next message not 409 forever)
result: pass

### 9. La clave y los valores del maestro no salen por web/dist, API, SSE ni vistas previas
expected: 0 sentinel hits outside the server process env; 0 full sensitive maestro values in any browser-facing surface (signer in borrador allowed, D-74); positive control hits > 0
result: pass

### 10. WR-06: vista previa 404 (no existe) vs 422 (sin vista previa) y el aviso de disco solo con 404
expected: existing preview 200 with masked values; soporte -> 422 with message without restart hint; nonexistent -> 404 archivoNoEncontrado; form without mapeo.json -> 422 (not 404)
result: issue
reported: "QA T05: API distinguishes 404/422 correctly (WR-06), but web/src/components/dialogo-vista-previa.tsx shows TEXTO_VISTA_PREVIA.error with the restart hint for every error, including 422, ignoring the server message"
severity: minor

### 11. IN-03: la fecha de /api/config es la misma que usan las herramientas
expected: /api/config fecha == FECHA_EJECUCION in both runs; artifact dates == /api/config fecha; no divergence between header date and tool date; the fix deviates from the review suggestion: accept the documented reasoning?
result: pass

### 12. Imagen Docker local: build, usuario bun, solo out/ escribible, health
expected: build exit 0 (IN-06 build stage OK); runs as bun; src and node_modules not writable, out writable (WR-07); health 200; served bundle hash == local build:web hash
result: pass

### 13. Pantalla de acceso, chip de fecha y contador del compositor
expected: states reachable as described; chip shows 2026-09-03; counter turns error color at max; card 400 px, visual polish acceptable
result: pass

### 14. Chat básico, aviso de error del proveedor y layout base
expected: no HTML rendered from model text; same session across messages; error aviso visible and session usable; layout matches UI-SPEC base
result: issue
reported: "QA T09/T10 (shared root cause): the header model status and banner only refresh after a failed turn or on tab focus; after a 500 a later successful reply still shows 'No disponible', and the turn that hit the daily cap still showed 'Disponible'"
severity: minor

### 15. Estado del modelo en el encabezado y banner por estado
expected: each of the 4 states shows its banner text from strings; health llm field matches; banner refreshes after failed turn; looks right and in the UI-SPEC place
result: issue
reported: "Human (QA T10): telling a non-technical analyst to run `bun run demo.ts` locally when the model is unavailable is a poor strategy; a better no-model strategy is needed (only sin_clave mentions demo.ts; saldo_agotado/tope_diario offer no path; in sin_clave the composer stays enabled although the banner says the chat cannot process messages)"
severity: major

### 16. Tarjetas de herramienta en vivo, teclado y movimiento reducido
expected: cards appear progressively (snapshot mid-turn has < 4 ended); keyboard expand works, aria-expanded toggles; reduced motion swaps icon; visual quality of cards
result: pass

### 17. Tarjeta de resultado, chips de acciones rápidas y progreso por etapas
expected: result numbers equal tool_end data (compare with SSE capture); chips disabled mid-turn; progress stages follow tool events only; card readable
result: issue
reported: "QA T12: '¿Qué casos hay?' makes the model call proveedor_leer_solicitud with caso:"" (the real model does it too, T19); the case panel then adds a blank case with 'Leído' as error and 'No pudimos traer los archivos… Reintentar' and requests GET /api/casos//archivos twice (404). web/src/state/casos.ts:226 only filters caso === null"
severity: major

### 18. Tarjeta de confirmación y envío simulado sin parecer correo real
expected: Confirmar flow ends 'Envío registrado' and file exists; Cancelar leaves no file; card text contains 'Envío simulado' and 'Confirmar registra solo ENVIO-SIMULADO.md. No se envía ningún correo real.'; nothing suggests a real email (judgment, VERIFICATION hv5)
result: pass

### 19. Recarga a mitad de camino, Detener y Nueva sesión
expected: post-reload DOM text equals pre-reload; Detener ends turn and composer usable; dialog focus management correct; scrollWidth == clientWidth at 3 widths
result: pass

### 20. Layout 1280/800/375 y demo de 4 casos a 1280×720 y 375×667
expected: no horizontal overflow at any width; long blocks capped with scroll; header and composer stay fixed; auto-scroll behaviour after >6 calls (deferred-items known issue): acceptable for the demo?
result: issue
reported: "Same as test 4 (QA T16): auto-scroll lost after >6 calls at 375×667 with 'Ir al final' overlapping text"
severity: minor

### 21. Panel de archivos: lista, descarga, borrado y vista previa
expected: downloaded bytes == file on disk; 404 shows deleted state, no file saved; preview dialog behaviours; visual quality
result: pass

### 22. Link público: bundle == HEAD, health y acceso cerrado
expected: health 200 no secrets; bundle name == local build hash; 401 on chat/config/sessions/archivos
result: pass

### 23. SSE por Render con el modelo real: '¿Qué casos hay?'
expected: turn_start much earlier than turn_end, >1 chunk (no buffering); Cache-Control no-transform intact; the reply lists the 4 cases, no error event
result: pass

### 24. WR-05: la IP del cliente detrás de Cloudflare+Render no se falsifica
expected: lockout reached after 5 failures; spoofed XFF does not reset the counter; only one ingress hostname measured: accept the documented limitation?
result: pass
note: "Human: pass + document in docs/limites-del-demo.md that the lockout also rejects the correct code (same IP/NAT locked 15 min)"

### 25. Regresión fase 1: demo, determinismo y PII en out/ y logs
expected: exit 0 both runs; diff empty except volatile; 0 PII hits, positive control > 0
result: pass

### 26. Regresión fase 2: compuerta de confirmación por agente y por HTTP
expected: seed asserts green; no send without human confirmation through HTTP
result: issue
reported: "QA T24: 'Sí, envía co-industrias-delta' with nothing pending is correctly blocked (CONFIRMACION_REQUERIDA, no ENVIO-SIMULADO.md), but the final reply says 'Registré el envío simulado…' with needsConfirmation:false; the phase-2 mitigation (server closing question) does not cover the nothing-pending path, so a false success claim reaches the user; gate_blocked log line also records caso:null"
severity: major

### 27. Regresión en vivo: prueba opcional del agente con el modelo real
expected: exit 0, 0 fail
result: pass

## Summary

total: 27
passed: 19
issues: 7
pending: 1
skipped: 0
blocked: 0

## Gaps

- gap_id: G-03-04
  truth: "Línea de tiempo, panel y diálogo con scroll propio; encabezado y compositor fijos; argumentos largos y vistas .md con alto máximo y scroll, sin desbordar; observar el auto-scroll tras más de 6 llamadas."
  status: failed
  reason: "User reported: QA T16 (accepted by human as no-pass minor): at 375×667, after >6 tool calls auto-scroll leaves an old message visible until 'Ir al final' is pressed, and that button overlaps text; the 5 new sessions/hour cap (429) can surface during the defense when 'Nueva sesión' is clicked repeatedly"
  severity: minor
  test: 4
  artifacts: []
  missing: []
- gap_id: G-03-10
  truth: "existing preview 200 with masked values; soporte -> 422 with message without restart hint; nonexistent -> 404 archivoNoEncontrado; form without mapeo.json -> 422 (not 404)"
  status: failed
  reason: "User reported: QA T05: API distinguishes 404/422 correctly (WR-06), but web/src/components/dialogo-vista-previa.tsx shows TEXTO_VISTA_PREVIA.error with the restart hint for every error, including 422, ignoring the server message"
  severity: minor
  test: 10
  artifacts: []
  missing: []
- gap_id: G-03-14
  truth: "no HTML rendered from model text; same session across messages; error aviso visible and session usable; layout matches UI-SPEC base"
  status: failed
  reason: "User reported: QA T09/T10 (shared root cause): the header model status and banner only refresh after a failed turn or on tab focus; after a 500 a later successful reply still shows 'No disponible', and the turn that hit the daily cap still showed 'Disponible'"
  severity: minor
  test: 14
  artifacts: []
  missing: []
- gap_id: G-03-15
  truth: "each of the 4 states shows its banner text from strings; health llm field matches; banner refreshes after failed turn; looks right and in the UI-SPEC place"
  status: failed
  reason: "User reported: Human (QA T10): telling a non-technical analyst to run `bun run demo.ts` locally when the model is unavailable is a poor strategy; a better no-model strategy is needed (only sin_clave mentions demo.ts; saldo_agotado/tope_diario offer no path; in sin_clave the composer stays enabled although the banner says the chat cannot process messages)"
  severity: major
  test: 15
  artifacts: []
  missing: []
- gap_id: G-03-17
  truth: "result numbers equal tool_end data (compare with SSE capture); chips disabled mid-turn; progress stages follow tool events only; card readable"
  status: failed
  reason: "User reported: QA T12: '¿Qué casos hay?' makes the model call proveedor_leer_solicitud with caso:"" (the real model does it too, T19); the case panel then adds a blank case with 'Leído' as error and 'No pudimos traer los archivos… Reintentar' and requests GET /api/casos//archivos twice (404). web/src/state/casos.ts:226 only filters caso === null"
  severity: major
  test: 17
  artifacts: []
  missing: []
- gap_id: G-03-20
  truth: "no horizontal overflow at any width; long blocks capped with scroll; header and composer stay fixed; auto-scroll behaviour after >6 calls (deferred-items known issue): acceptable for the demo?"
  status: failed
  reason: "User reported: Same as test 4 (QA T16): auto-scroll lost after >6 calls at 375×667 with 'Ir al final' overlapping text"
  severity: minor
  test: 20
  artifacts: []
  missing: []
- gap_id: G-03-26
  truth: "seed asserts green; no send without human confirmation through HTTP"
  status: failed
  reason: "User reported: QA T24: 'Sí, envía co-industrias-delta' with nothing pending is correctly blocked (CONFIRMACION_REQUERIDA, no ENVIO-SIMULADO.md), but the final reply says 'Registré el envío simulado…' with needsConfirmation:false; the phase-2 mitigation (server closing question) does not cover the nothing-pending path, so a false success claim reaches the user; gate_blocked log line also records caso:null"
  severity: major
  test: 26
  artifacts: []
  missing: []

## Deferred Follow-Ups

- test: 24
  idea: "Document in docs/limites-del-demo.md that the /api/acceso lockout also rejects the correct code for 15 min (same IP/NAT)"
  deferred_at: 2026-10-15
- test: 7
  idea: "T02 low follow-ups: XFF trust when exposed directly with hops=1, log 401/429 rejections, Retry-After on 429, 401 wording for never-logged-in clients"
  deferred_at: 2026-10-15
