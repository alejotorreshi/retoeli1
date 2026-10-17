---
phase: "03"
slug: "chat-web-api-sse-y-despliegue"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-10-16"
---

# Phase 03 — Security

> Contrato de seguridad de la fase: registro de amenazas, riesgos aceptados y rastro de auditoría.
> El registro sale de los 47 bloques `<threat_model>` de los PLAN.md (87 amenazas únicas) y de las secciones `## Threat Flags` de los SUMMARY. El auditor (gsd-security-auditor, ASVS L1, block_on high) verificó cada mitigación contra el código vigente, que incluye el revert `5f07e7c`: el limitador de acceso es el de 03-45.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Internet pública → `/api/acceso` y `Authorization: Bearer` | Prueba del código de acceso compartido; fuerza bruta y rotación de IP | Código de acceso (secreto) |
| Navegador (cookie) → `/api/*` | Cookie firmada HttpOnly, SameSite=Strict, Path=/api; CSRF | Token de acceso firmado |
| Cliente autenticado → `POST /api/chat` (SSE/JSON) | Cuerpo no confiable, vida de la conexión, gasto del modelo | Mensajes de la analista, eventos del bucle |
| Bucle del agente → frames SSE y vista de sesión | Eventos que podrían llevar secretos, PII del maestro o errores internos | Resultados de herramientas, texto del modelo |
| Texto del modelo y del servidor → DOM de React | XSS, falsificación de estado de la UI | Texto, argumentos de herramientas, avisos |
| Botones de la UI → `accion` estructurada y compuerta | Confirmación humana antes del envío simulado | `accion`, `caso`, autorización de un solo uso |
| Parámetros de ruta (`caso`, `nombre`) → sistema de archivos | Traversal y bypass en descargas y vistas previas | Formularios, paquete, `mapeo.json` (enmascarado) |
| `/api/health` y `/api/config` → página | Información del proveedor y de la configuración | Proveedor, modelo, estado del LLM, fecha y casos |
| Borde de Render (Cloudflare) → contenedor | `X-Forwarded-For`, buffering del SSE, health checks | IP del cliente, stream |
| Secretos del servidor → respuestas, logs y bundle | Clave del proveedor, código, secreto HMAC | Secretos (nunca deben cruzar) |
| Build de Vite → `web/dist` público | El bundle es público | Código del front (sin secretos) |
| Almacenamiento del navegador → sesión | `sessionId` en localStorage, código solo en memoria | Id de sesión |
| Registro npm → `node_modules` y la imagen | Código de terceros en el build y el runtime | Dependencias fijadas en `bun.lock` |
| Contenedor → host | Usuario del proceso y escritura en disco | Solo `out/` escribible |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Information disclosure | errores del stream en chat.route | high | mitigate | try/catch propio con `MENSAJE_HTTP.errorInterno` (`chat.route.ts:115-118`); `onError` genérico (`server.wiring.ts:198-205`); stream.test | closed |
| T-03-02 | Denial of service | idle timeout de Bun en SSE/JSON | high | mitigate | `c.env.timeout(c.req.raw, 0)` y latido de 8 s (`chat.route.ts:158,107`); stream.test con idleTimeout 1 s | closed |
| T-03-03 | Information disclosure | frames SSE | high | mitigate | `redactar` en `sse.service.ts:5-7`; salud.test y chat.test sin la clave | closed |
| T-03-04 | Denial of service | streams abandonados | medium | mitigate | `onAbort` corta el turno (`chat.route.ts:105-106,141`); stream.test, topes.test | closed |
| T-03-05 | Tampering | XSS con texto del modelo | high | mitigate | sin `innerHTML`/`dangerouslySetInnerHTML` en `web/src`; guardián W5; CSP (`server.wiring.ts:174-191`) | closed |
| T-03-06 | Information disclosure | secretos en `web/dist` | high | mitigate | W3/W6; clave.test con build fresco y centinelas | closed |
| T-03-07 | Denial of service | turnos pagos duplicados | medium | mitigate | `enviarTurno` solo desde `iniciarTurno` con guardas (`usar-chat.ts:65-88`) | closed |
| T-03-08 | Information disclosure | traversal en estáticos | medium | mitigate | `static.route.ts:14-17`; estatico.test | closed |
| T-03-09 | Spoofing | fuerza bruta del código | high | mitigate | limitador (`rate-limiter.service.ts:60-68`), Bearer cuenta, `timingSafeEqual`, mínimo 12 caracteres (`env.ts:352-359`); acceso.test | closed |
| T-03-10 | Spoofing / Elevation | cookie falsificada o vencida | high | mitigate | `setSignedCookie` HttpOnly/Strict/Path (`access.route.ts:37-50`); `access-token.service.ts`; secreto obligatorio en producción | closed |
| T-03-11 | Tampering | CSRF en `POST /api/chat` | medium | mitigate | SameSite Strict; `json-only.middleware.ts`; bordes.test | closed |
| T-03-12 | Information disclosure | código guardado en el navegador | high | mitigate | código solo en estado del componente; W7; localStorage solo en `sesion-local.ts` | closed |
| T-03-13 | Denial of service | cuerpos y mensajes grandes | medium | mitigate | `bodyLimit` (`server.wiring.ts:230`); tope de mensaje (`chat.route.ts:161`); bordes.test | closed |
| T-03-14 | Spoofing | XFF falsificado | high | mitigate | cuenta desde la derecha (`client-ip.service.ts:61-67`); `TRUSTED_PROXY_HOPS=3` medido en Render | closed |
| T-03-15 | Tampering | inyección de script en la SPA | medium | mitigate | CSP `script-src 'self'`, `frame-ancestors 'none'`, nosniff; bordes.test | closed |
| T-03-16 | Information disclosure | clave, código o HMAC en bundle, API o stream | high | mitigate | clave.test (incluye 402 y 3 turnos concurrentes; sin `VITE_`) | closed |
| T-03-17 | Information disclosure | secretos en `render.yaml` o `.env.example` | high | mitigate | `sync: false` y `generateValue`; contrato-despliegue.test; clave.test | closed |
| T-03-18 | Elevation of privilege | contenedor como root | medium | mitigate | `USER bun`, solo `out/` escribible (`Dockerfile`); contrato-despliegue.test | closed |
| T-03-19 | Denial of service | buffering del SSE en el borde | medium | mitigate | cabeceras anti-buffering (`chat.route.ts:124-125`); `curl -N` en vivo (03-11) | closed |
| T-03-20 | Denial of service | drenaje del saldo prepago | high | mitigate | 10 mensajes/min, turnos simultáneos, sesiones nuevas/h, `withDailyBudget`; topes.test | closed |
| T-03-21 | Information disclosure | detalle de `/api/health` | medium | mitigate | solo `ok`, `provider`, `model` y el enum `llm` (`health.route.ts:14-23`) | closed |
| T-03-22 | Denial of service | contador diario que no se reinicia | medium | mitigate | `systemClock(TZ_NEGOCIO)`; daily-budget.decorator.test | closed |
| T-03-23 | Repudiation | respaldo fuera del tope | medium | mitigate | `withDailyBudget` envuelve a `withFallback` (`agente.wiring.ts:113-119`) | closed |
| T-03-24 | Information disclosure | `resultado` y tarjetas con datos del maestro | high | mitigate | resultado visible proyectado (`paso-herramientas.service.ts`, `resultado-visible.service.ts`); eventos-visibles.test | closed |
| T-03-25 | Tampering | tarjeta o progreso movidos por texto del modelo | medium | mitigate | `casos.ts` pliega solo llamadas y confirmaciones; progreso.test | closed |
| T-03-26 | Elevation of privilege | `accion` falsificada o vieja | high | mitigate | solo si el caso está pendiente; autorización de un solo uso (`compuerta.policy.ts:65-68`) | closed |
| T-03-27 | Tampering | cierre local o doble clic | medium | mitigate | reductor puro y deshabilitado en la tarjeta; el servidor consume la autorización | closed |
| T-03-28 | Information disclosure | la vista de sesión filtra datos | high | mitigate | sin mensajes de sistema ni razonamiento, con redacción (`vista-sesion.service.ts`) | closed |
| T-03-29 | Spoofing / Information disclosure | adivinar o repetir el id de sesión | medium | mitigate | `randomUUID`; `PATRON_SESION`, no crea ni renueva | closed |
| T-03-30 | Information disclosure | traversal o bypass en descargas | high | mitigate | `artifact-reader.adapter.ts` (lista blanca, sin enlaces simbólicos); artefactos.test | closed |
| T-03-31 | Information disclosure | PII en vistas previas | high | mitigate | `mapeo.json` enmascarado (`artifact-reader.adapter.ts:143-159`) | closed |
| T-03-32 | Tampering | sniffing o render inline | medium | mitigate | attachment, tipo explícito, no-store, nosniff | closed |
| T-03-33 | Repudiation | regeneración silenciosa | low | mitigate | rutas de artefactos solo de lectura; `archivosFaltantes` | closed |
| T-03-34 | Information disclosure | cuerpo de `/api/health` | high | mitigate | health no llama al adaptador; salud.test | closed |
| T-03-35 | Elevation of privilege | http alcanza infra o el entorno | medium | mitigate | guardianes de architecture.test; `src/server.ts` no lee el entorno | closed |
| T-03-36 | Information disclosure | código o secreto en respuestas o logs | high | mitigate | logger con secretos; token solo con versión y vencimiento | closed |
| T-03-37 | Information disclosure | código pegado en el chat | high | mitigate | `secretosAdicionales` redacta el código (`agente.wiring.ts`) | closed |
| T-03-38 | Information disclosure | `/api/config` | low | mitigate | detrás de `requireAccess`, sin rutas ni claves | closed |
| T-03-39 | Denial of service | rotación de sesiones | high | mitigate | tope de sesiones nuevas por IP; topes.test | closed |
| T-03-40 | Information disclosure / DoS | estado del modelo en el banner | low | mitigate | copia por enum; health sin intervalo | closed |
| T-03-41 | Information disclosure / Tampering | argumentos de la tarjeta | medium | mitigate | `<pre>` con `JSON.stringify`; W5 | closed |
| T-03-42 | Tampering | etapas movidas por texto | medium | mitigate | progreso.test | closed |
| T-03-43 | Information disclosure | `sessionId` en el navegador | low | accept | ver Accepted Risks Log | closed |
| T-03-44 | DoS / Repudiation | reconciliar al Detener o Recargar | low | mitigate | un reintento con `REINTENTO_OCUPADA_MS` (`cliente-api.ts`) | closed |
| T-03-45 | Tampering | `casoDeArgumentos` | medium | mitigate | `PATRON_CASO` en el esquema y el despacho | closed |
| T-03-46 | Spoofing | panel de casos | low | mitigate | progreso.test | closed |
| T-03-47 | Spoofing | cierre del turno | high | mitigate | cierre del servidor (`compuerta.policy.ts`, `cierre-turno.builder.ts`) | closed |
| T-03-48 | Tampering | `TEXTO_ENVIO_NO_REGISTRADO` | medium | mitigate | solo constantes y caso validado (`strings.ts`) | closed |
| T-03-49 | Repudiation | línea `gate_blocked` | low | mitigate | `bitacora-turno.service.ts` | closed |
| T-03-50 | Information disclosure | texto de error del diálogo | low | mitigate | nodos de texto; W5 | closed |
| T-03-51 | Spoofing | diagnóstico de disco efímero | low | mitigate | solo con 404 (`casos.ts`) | closed |
| T-03-52 | Denial of service | refresco de health por turno | low | accept | ver Accepted Risks Log | closed |
| T-03-53 | Information disclosure | banner del proveedor | low | mitigate | copia estática en `web/src/config/strings.ts` | closed |
| T-03-54 | Denial of service | botón "Comprobar de nuevo" | low | mitigate | deshabilitado mientras comprueba; aborta el pedido anterior | closed |
| T-03-55 | Denial of service | pedidos sin modelo | low | mitigate | pausa del envío en el cliente; el servidor mantiene 503/429 | closed |
| T-03-56 | Tampering | pausa en el cliente | low | accept | ver Accepted Risks Log | closed |
| T-03-57 | Denial of service | tope de 20 sesiones/h en Render | medium | accept | ver Accepted Risks Log | closed |
| T-03-58 | Information disclosure | minutos en el 429 | low | accept | ver Accepted Risks Log | closed |
| T-03-59 | Spoofing | IP para el tope | low | transfer | borde de Render/Cloudflare fija `X-Forwarded-For`; `TRUSTED_PROXY_HOPS=3` medido (`docs/limites-del-demo.md`) | closed |
| T-03-60 | Denial of service | manejadores de la línea de tiempo | low | accept | ver Accepted Risks Log | closed |
| T-03-61 | Tampering | restaurar `sessionId` | low | mitigate | solo desde `turn_start`; `PATRON_SESION` en el servidor | closed |
| T-03-62 | Information disclosure | `sessionId` en localStorage | low | accept | ver Accepted Risks Log | closed |
| T-03-63 | Repudiation | deriva entre spec y código | low | mitigate | literales iguales entre UI-SPEC y `strings.ts` (03-39) | closed |
| T-03-64 | Spoofing | envío sin caso legible y respaldo JSON | high | mitigate | `guardado-turno.service.ts`; `compuerta.policy.ts`; compuerta-casos.test, chat.test | closed |
| T-03-65 | Spoofing | etiquetas cortas de los chips | low | accept | ver Accepted Risks Log | closed |
| T-03-66 | Spoofing | `simular_envio` truncado | high | mitigate | el truncado no se ejecuta (`paso-herramientas.service.ts`); compuerta-casos.test | closed |
| T-03-67 | Spoofing | aviso que niega un reintento | medium | mitigate | `reemplazadoPorReintento` en la política | closed |
| T-03-68 | Elevation of privilege | autorización ante un truncado | high | mitigate | `darPaso` no pasa por `despacharLlamada` | closed |
| T-03-69 | Elevation of privilege | anti fuerza bruta con rotación IPv6 | high | mitigate | /64 agrupado; nunca desaloja una clave bloqueada; falla cerrado | closed |
| T-03-70 | Denial of service | falla cerrada con la tabla llena | medium | accept | reemplazada por T-03-79; ver Accepted Risks Log | closed |
| T-03-71 | Denial of service | memoria del limitador | low | mitigate | tope de 10 000 claves; `trackedKeys` probado | closed |
| T-03-72 | Elevation of privilege | confirmaciones de una sesión descartada | medium | mitigate | `conversacion.ts` (D-73.5.2); conversacion.test | closed |
| T-03-73 | Information disclosure | `sessionId` en localStorage | low | accept | ver Accepted Risks Log | closed |
| T-03-74 | Denial of service | manejador de scroll | low | accept | ver Accepted Risks Log | closed |
| T-03-75 | Denial of service | falla cerrada de los limitadores de chat | medium | accept | ver Accepted Risks Log | closed |
| T-03-76 | Denial of service | rotación de un golpe (CR-01) | high | mitigate | sin cupo de desalojo, hereda los golpes (`rate-limiter.service.ts:30-42`); prueba CR-01 | closed |
| T-03-77 | Elevation of privilege | rotación en ronda | high | mitigate | cota K × L exacta; rate-limiter.service.test | closed |
| T-03-78 | Denial of service | IP legítima que hereda golpes ajenos | low | accept | ver Accepted Risks Log | closed |
| T-03-79 | Denial of service | falla cerrada con todas las claves bloqueadas | medium | accept | ver Accepted Risks Log | closed |
| T-03-80 | Elevation of privilege | pedidos simultáneos antes de contar | high | mitigate | `hit` síncrono antes del primer `await` (`access.route.ts:57`, `access.middleware.ts:20`); acceso.test (50 simultáneos → 5 evaluados) | closed |
| T-03-81 | Denial of service | doble envío correcto | medium | mitigate | un golpe rechazado no suma; `release` ante código correcto | closed |
| T-03-82 | Tampering | `release` sobre una ventana nueva | low | accept | ver Accepted Risks Log (override 1 de 03-VERIFICATION.md) | closed |
| T-03-83 | Spoofing | SIN_CASO que niega un envío registrado | medium | mitigate | texto nuevo en `strings.ts:257`; compuerta-casos.test | closed |
| T-03-84 | Spoofing | truncado confirmado atribuido a falta de confirmación | medium | mitigate | evento `TRUNCADO_CONFIRMADO`; la semántica tras un FALLIDO está aceptada (override 2) | closed |
| T-03-85 | Elevation of privilege | autorización ante un truncado confirmado | high | mitigate | igual que T-03-68; no escribe `ENVIO-SIMULADO.md` | closed |
| T-03-86 | Denial of service | reductor de seguimiento | low | accept | ver Accepted Risks Log | closed |
| T-03-SC | Tampering | instalaciones npm | high | mitigate | versiones exactas, `bun.lock` versionado, `bun audit` en `check` (0 vulnerabilidades), `--frozen-lockfile` y `--production` en la imagen; compuerta de paquetes aprobada por la usuaria (03-01) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-03-43, T-03-62, T-03-73 | El `sessionId` vive en localStorage para recargar la conversación; no da acceso sin la cookie y el código nunca se guarda (03-UI-SPEC.md:320) | elianatorres5772 (planes 03-25, 03-42) | 2026-10-15 |
| AR-02 | T-03-52 | Health se refresca al terminar cada turno, sin intervalo (PLAN 03-32) | elianatorres5772 (plan 03-32) | 2026-10-15 |
| AR-03 | T-03-56 | La pausa del envío es solo del cliente; el servidor rechaza igual (PLAN 03-34) | elianatorres5772 (plan 03-34) | 2026-10-15 |
| AR-04 | T-03-57, T-03-58 | 20 sesiones nuevas por hora en Render y los minutos de espera en el 429; el tope diario de tokens sigue siendo el límite real de gasto (`docs/limites-del-demo.md`; QA T32 pass) | elianatorres5772 (plan 03-35, UAT 10) | 2026-10-16 |
| AR-05 | T-03-60, T-03-74, T-03-86 | Costo de los manejadores de scroll y del reductor de seguimiento; incluye la limitación aceptada de una sola flecha de 40 px a 375×667 (override 3 de 03-VERIFICATION.md) | elianatorres5772 (planes 03-36, 03-43, 03-47; UAT 7) | 2026-10-16 |
| AR-06 | T-03-65 | Etiquetas cortas de los chips (PLAN 03-37) | elianatorres5772 (plan 03-37) | 2026-10-15 |
| AR-07 | T-03-70, T-03-75, T-03-79 | Los limitadores fallan cerrados solo con todas sus claves bloqueadas; alternativas peores (`docs/limites-del-demo.md`) | elianatorres5772 (planes 03-41, 03-44) | 2026-10-15 |
| AR-08 | T-03-78 | Una IP nueva puede heredar hasta 4 golpes ajenos con la tabla llena, pero conserva al menos un intento | elianatorres5772 (plan 03-44) | 2026-10-15 |
| AR-09 | T-03-82, T-03-80 (residuo) | El tope de 5 por IP es aproximado con pedidos lentos o que cruzan la ventana, y credenciales correctas simultáneas pueden recibir el 429 de intentos fallidos; la SPA no lo provoca. Corrección de un despliegue real documentada (`docs/limites-del-demo.md`; override 1 de 03-VERIFICATION.md; revert `5f07e7c`) | elianatorres5772 | 2026-10-16 |
| AR-10 | T-03-84 (semántica) | Tras un envío confirmado que falló, el truncado del mismo caso pide una confirmación nueva (override 2 de 03-VERIFICATION.md) | elianatorres5772 | 2026-10-16 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-16 | 87 | 87 | 0 | gsd-security-auditor (ASVS L1, block_on high); 26 archivos de pruebas de seguridad, 594 pass / 0 fail; `bun audit` 0 vulnerabilidades |

Notas del auditor:
- Los hallazgos WR-02 e IN-04 del último review venían de `71d8d20`, revertido por `5f07e7c`; `AttemptLimiter` y `RESULTADO_RESERVA` ya no existen en `src`.
- WR-03 (sin `finally`) no debilita T-03-09 ni T-03-80: la reserva ya es un golpe, así que un fallo entre `hit` y `release` queda del lado cerrado.
- `03-REVIEW-DISPOSITION.md` todavía muestra CR-01 e IN-05 como `open`, pero el código vigente los resuelve (prueba CR-01 en rate-limiter.service.test; comprobación `never` en `compuerta.policy.ts:116-118`).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-16
