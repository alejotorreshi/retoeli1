---
phase: 03-chat-web-api-sse-y-despliegue
plan: 11
subsystem: infra
tags: [docker, render, sse, cloudflare, x-forwarded-for, rate-limit, seguridad, despliegue]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "API SSE con latido (03-02), control de acceso y limitador por IP (03-04, 03-06, 03-08), servidor de la SPA y límites de borde (03-09), pantalla de acceso (03-10)"
provides:
  - "Dockerfile multi-etapa sobre oven/bun:1.4.3-slim que construye web/dist y corre bun src/server.ts como USER bun"
  - "render.yaml: un servicio web Docker free con health en /api/health y secretos fuera del repo"
  - "tests/seguridad/clave.test.ts: escaneo de centinelas de SEG-01 sobre el bundle, la API, el stream SSE, un 402 y tres turnos concurrentes"
  - "tests/despliegue/contrato-despliegue.test.ts: contrato textual de Dockerfile, render.yaml y .dockerignore"
  - "Link público vivo: https://registro-proveedor-bfnt.onrender.com"
  - "Medición en el link público: el SSE llega en vivo a través del borde de Render y Cloudflare"
  - "Hallazgo medido: con TRUSTED_PROXY_HOPS=1 el limitador no usa la IP del cliente sino una IP de proxy de un grupo pequeño"
affects: [03-12, 03-16, 03-19, defensa, README, SOLUCION.md]

actuals:
  tokens: 9500
  tasks: 3
  commits: 2

plan_head_before: af26be3491cd2b324602cbb2cd03edbe663df6c7
plan_head_after: 17745b3

tech-stack:
  added: []
  patterns:
    - "Imagen de dos etapas: la SPA se construye en la etapa de build y la de ejecución instala solo producción con bun.lock congelado"
    - "Secretos de Render con sync: false y generateValue; ningún valor en el repo"
    - "Sondeo externo del limitador: la misma falsificación repetida y peticiones sin cabecera distinguen una clave estable de un grupo de proxies"

key-files:
  created:
    - Dockerfile
    - render.yaml
    - tests/despliegue/contrato-despliegue.test.ts
    - tests/seguridad/clave.test.ts
  modified:
    - .dockerignore

key-decisions:
  - "Render free (Docker) queda como host: el SSE llega en vivo (turn_start a 389 ms y turn_end a 8592 ms), así que no hace falta el plan B (Koyeb o Fly) ni el fallback JSON en la UI"
  - "TRUSTED_PROXY_HOPS=1 es incorrecto en Render: la entrada más a la derecha de X-Forwarded-For es una IP de proxy que varía entre un grupo pequeño. El valor correcto (2 o más) lo fija la usuaria midiendo entradasXff en los logs o validando desde fuera; no se cambia render.yaml sin la medición"
  - "Cloudflare quita la cabecera X-Accel-Buffering en el borde, pero no bufferiza: Cache-Control no-cache, no-transform llega intacto y basta"

patterns-established:
  - "Evidencia de despliegue en el SUMMARY: tiempos de llegada de cada evento SSE medidos con fetch y con curl -N contra el link público"

requirements-completed: [DEP-02, SEG-01, DEP-01]

coverage:
  - id: D1
    description: "Imagen Docker portable y Blueprint de Render con contrato textual"
    requirement: DEP-02
    verification:
      - kind: unit
        ref: "tests/despliegue/contrato-despliegue.test.ts"
        status: pass
      - kind: manual_procedural
        ref: "docker build linux/amd64 (103 MB) y docker run en modo producción con env ficticia, hecho por el orquestador"
        status: pass
    human_judgment: false
  - id: D2
    description: "La clave, el código de acceso y el secreto HMAC no salen del backend: bundle, API, stream, 402 y tres turnos concurrentes"
    requirement: SEG-01
    verification:
      - kind: integration
        ref: "tests/seguridad/clave.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "El link público responde health sin clave, config con Bearer (fecha 2026-09-03) y 401 al chat sin acceso"
    requirement: DEP-02
    verification:
      - kind: manual_procedural
        ref: "curl contra https://registro-proveedor-bfnt.onrender.com (2026-10-15T01:42:58Z)"
        status: pass
    human_judgment: false
  - id: D4
    description: "El SSE llega en vivo a través de Render: turn_start al menos 500 ms antes de turn_end"
    requirement: DEP-02
    verification:
      - kind: manual_procedural
        ref: "bun fetch streaming y curl -N contra POST /api/chat en el link público"
        status: pass
    human_judgment: false
  - id: D5
    description: "El limitador de /api/acceso usa una IP que el cliente no puede falsificar y que es del cliente"
    requirement: SEG-01
    verification:
      - kind: manual_procedural
        ref: "sondeo de X-Forwarded-For en el link público (2026-10-15T01:44:31Z a 01:45:35Z)"
        status: fail
    human_judgment: true
    rationale: "El sexto intento respondió 401 en lugar de 429 y el bloqueo es no determinista; corregirlo requiere que la usuaria cambie TRUSTED_PROXY_HOPS en Render (y lea los logs de depuración), y luego repetir el sondeo"
  - id: D6
    description: "Un clon limpio arranca con bun run dev en menos de 120 s"
    requirement: DEP-01
    verification:
      - kind: manual_procedural
        ref: "verificación del clon limpio del Task 1"
        status: unknown
    human_judgment: true
    rationale: "En esta continuación no se volvió a correr: el hook de lectura de secretos bloquea el comando porque escribe un .env (ficticio) en el clon. Debe confirmarlo el verificador o 03-16"

duration: 70min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 11: Despliegue en Render y prueba de que la clave no sale del backend Summary

**El agente está publicado en https://registro-proveedor-bfnt.onrender.com como un servicio Docker free. El SSE llega en vivo a través del borde de Render y Cloudflare (turn_start a 389 ms, turn_end a 8592 ms). La clave queda probada fuera del bundle, la API y el stream. El sondeo de X-Forwarded-For encontró un problema real: con `TRUSTED_PROXY_HOPS=1` el limitador cuenta por una IP de proxy compartida y no por la del cliente, así que hay que subir ese valor en Render.**

## Performance

- **Duración:** unos 70 min en total, contando la pausa del checkpoint humano. La continuación del Task 3 tomó unos 5 min de sondeos.
- **Inicio:** 2026-10-15T01:05Z (Task 1 RED en 7ccf0b9 a las 01:11Z)
- **Fin:** 2026-10-15T01:47Z
- **Tasks:** 3 de 3 (Task 2 lo hicieron la usuaria y el orquestador)
- **Archivos:** 5 (4 creados, 1 modificado)

## Accomplishments

- Imagen Docker de dos etapas y Blueprint de Render, con contrato textual (DEP-02).
- Escaneo de centinelas de SEG-01 sobre el bundle de Vite, todas las respuestas de la API, los frames SSE, un 402 del proveedor y tres turnos SSE concurrentes. Pasa verde (20 pruebas entre los dos archivos).
- Servicio vivo en Render. Health público sin clave, config solo con acceso y chat 401 sin acceso.
- Se midió streaming real en el link público: los eventos llegan a medida que ocurren, no al final.
- Se midió el limitador por IP en Render. Encontró una configuración incorrecta de saltos de proxy, y queda una instrucción precisa para la usuaria.

## Task Commits

1. **Task 1 (RED): contrato del despliegue y escaneo de centinelas de SEG-01**: `7ccf0b9` (test)
2. **Task 1 (GREEN): imagen Docker y Blueprint de Render**: `17745b3` (feat)
3. **Task 2: remoto y servicio en Render**: sin commit. La usuaria creó `origin` (https://github.com/alejotorreshi/retoeli1.git, privado) y aplicó el Blueprint. El orquestador hizo push de `main` a pedido de ella (HEAD `17745b3` = `origin/main`).
4. **Task 3: sondeos en el link público**: sin commit de código. La evidencia está en este SUMMARY.

## Files Created/Modified

- `Dockerfile`: dos etapas sobre `oven/bun:1.4.3-slim`. La primera construye la SPA. La segunda instala solo producción, copia `tsconfig.json`, `src`, `agent`, `reto-01/fixtures` y `web/dist`, y corre `bun src/server.ts` como `USER bun` con `EXPOSE 10000`.
- `render.yaml`: servicio `registro-proveedor` con `runtime: docker`, `plan: free`, `healthCheckPath: /api/health`, `FECHA_EJECUCION "2026-09-03"`, `TZ_NEGOCIO`, `LOG_LEVEL info`, `TRUSTED_PROXY_HOPS "1"`, `LLM_API_KEY` y `ACCESS_CODE` con `sync: false`, y `ACCESS_TOKEN_SECRET` con `generateValue: true`.
- `.dockerignore`: suma `.qa`, `.codegraph`, `.gsd`, `.claude`, `.agents`, `.playwright-mcp` y `web/node_modules`.
- `tests/despliegue/contrato-despliegue.test.ts`: contrato textual de los tres archivos.
- `tests/seguridad/clave.test.ts`: escaneo de SEG-01, con el bundle, la API, el SSE, el 402, la concurrencia con `Promise.all` y `.env.example`.

## Evidencia

### DEP-02: imagen local (la recogió el orquestador)

- La imagen real se construyó en local para `linux/amd64` y pesa 103 MB.
- Corrió en modo producción con env ficticia y dio estos resultados: `/api/health` 200, SPA 200, `/api/config` 401 sin acceso, `/api/acceso` 204 con cookie, y `/api/config` con acceso OK (`fechaEjecucion` 2026-09-03, 4 casos).
- La CSP está presente.
- Playwright hizo acceso → chat y mostró "Fecha de ejecución 2026-09-03".

### Task 3, paso 1: health, config y 401 (2026-10-15T01:42:58Z)

- `GET /api/health` respondió 200 con `{"ok":true,"provider":"deepseek","model":"deepseek-flash"}`, sin clave. La respuesta trae los encabezados de seguridad (CSP, HSTS, nosniff, `X-Frame-Options`). Entrega `server: cloudflare` y `rndr-id: 3d94580b-580d-4b05`.
- `GET /api/config` sin acceso respondió 401.
- `GET /api/config` con Bearer respondió `{"fechaEjecucion":"2026-09-03","zona":"America/Bogota","casos":["co-industrias-delta","ec-corp-andina","hn-agroexport-sula","pa-logistica-istmo"],"presupuestoSesion":300000,"mensajeMaximo":2000}`.
- `POST /api/chat` sin acceso respondió **401**.

### Task 3, paso 2: el SSE llega en vivo (turnos reales autorizados por la usuaria)

Hubo tres turnos reales en total contra el servicio desplegado, todos con "¿Qué casos hay disponibles?". Cada uno costó unos 12.700 tokens, casi todo en cache hit.

**fetch en streaming con bun** (encabezados de respuesta a los 386 ms, `content-type: text/event-stream`, `cache-control: no-cache, no-transform` intacto y sin `content-encoding`):

| Evento | ms desde el envío |
|---|---|
| turn_start | 389 |
| usage | 4572 |
| tool_start | 4572 |
| tool_end | 4658 |
| `: ping` | 8385 |
| usage | 8590 |
| text | 8592 |
| turn_end | 8592 |

Llegaron 5 trozos de red distintos. turn_end − turn_start = **8203 ms (≥ 500)**, así que el resultado es **STREAM_VIVO**.

**curl -N** (marca al llegar cada línea): turn_start a 342 ms, usage a 5065, tool_start a 5080, tool_end a 5092, `: ping` a 8401, usage a 9041, text a 9058 y turn_end a 9071. Los frames aparecen a medida que ocurren.

**Fallback JSON** (`Accept: application/json`): respondió 200 en 8,3 s con `{ sessionId, reply, toolCalls[1], needsConfirmation:false }`.

En el stream crudo no aparecen ni el código de acceso ni nada con forma de clave (`sk-`).

- Cloudflare **quita** `X-Accel-Buffering: no` en el borde (la respuesta llega sin ella), pero no bufferiza. `Cache-Control: no-cache, no-transform` alcanza.
- No hace falta el checkpoint de decisión del paso 4 (fallback JSON o cambio de host).
- Backstop de concurrencia: los tres turnos terminaron con `turn_end` y sin cortes. Nadie observó los eventos del servicio en Render durante el turno, porque el orquestador no tiene acceso al panel.

### Task 3, paso 3: sondeo de X-Forwarded-For (FALLA, hallazgo real)

`TRUSTED_PROXY_HOPS=1` en Render; la IP pública de esta máquina es una sola y solo IPv4 (no hay IPv6 para comparar).

1. **Plan original, 01:44:31Z.** Mandé cinco códigos errados con `X-Forwarded-For` de 203.0.113.1 a .5, después un sexto con .6, un séptimo sin cabecera y un octavo con `198.51.100.7, 203.0.113.8`. Los ocho respondieron **401** y ninguno 429. El criterio de aceptación (el sexto debía dar 429) **no se cumple**.
2. **Misma falsificación seis veces, 01:44:56Z.** Mandé `X-Forwarded-For: 203.0.113.50` seis veces. Los estados fueron 429 429 429 429 429 401. Si la clave fuera la entrada falsificada, el patrón sería al revés (401×5 y después 429). Por lo tanto la clave no es la entrada del cliente.
3. **Sin cabecera, 01:45:35Z.** Mandé diez códigos errados y los estados fueron 429 401 401 401 401 429 429 429 429 429. Después mandé seis `GET /api/config` con el Bearer correcto y respondieron 429 429 429 200 429 429.

**Conclusión:** sin ningún dato del cliente que cambie, el resultado salta entre 429 y 401/200. La clave del limitador es la entrada más a la derecha de `X-Forwarded-For`, y esa entrada es una IP de proxy de Render o Cloudflare que rota dentro de un grupo pequeño (2 o 3 valores). No es la IP del cliente. Esto tiene dos consecuencias:

- **Bloqueo compartido.** Cinco códigos errados de cualquier persona bloquean, para todos los clientes que pasan por el mismo proxy, `/api/acceso` y los Bearer de `/api/chat` y `/api/config` durante 15 minutos. Es un riesgo directo para la defensa: los evaluadores podrían quedar bloqueados por los errores de otros.
- **Más intentos.** Un atacante tiene 5 × N intentos por ventana en lugar de 5. Las entradas falsificadas igual no reinician el contador.

Con los datos de esta máquina, `entradasXff` sin cabecera debe ser 2 o más, o bien Render quita la cabecera y la clave cae al socket del proxy. Para distinguir esos dos casos hay que leer los logs (ver "Instrucciones para la usuaria").

**Estado actual del bloqueo:** las claves de proxy que llegaron a 5 fallos quedan bloqueadas hasta cerca de las **02:01Z** (ventana fija de 15 min). Un reinicio del servicio también las limpia, porque los contadores viven en memoria.

## Decisions Made

- Render se queda como host porque el SSE no se bufferiza. No se usa el plan B.
- No cambié `render.yaml` a otro valor de `TRUSTED_PROXY_HOPS` sin medirlo. Si pongo un valor demasiado alto, la clave vuelve a ser una entrada falsificable, y uno demasiado bajo deja el grupo de proxies.

## Deviations from Plan

- **Sondeos adicionales en el paso 3** (diagnóstico, sin cambio de código). El sondeo del plan falló, así que agregué dos variantes que se pueden observar desde fuera: la misma falsificación repetida y peticiones sin cabecera. Así puedo distinguir "la clave la controla el cliente" de "la clave rota del lado del servidor" sin leer logs.
- **Paso 2, tercer turno real.** Además del fetch en streaming y del `curl -N`, corrí un turno con fallback JSON, como permitía la autorización de la orquestación (un turno JSON). En total fueron tres turnos, todos contra el servicio desplegado y ninguno contra un servidor local.
- **La verificación del clon limpio (DEP-01) no se volvió a correr** en esta continuación. El hook de lectura de secretos bloquea el comando del plan porque crea un `.env` ficticio en el clon. Queda marcada como `unknown` en la cobertura. `bun test` de los dos archivos del Task 1 (20 de 20) y `bun run check` (exit 0) sí se volvieron a correr.

**Impacto:** el despliegue y SEG-01 cumplen. La verdad "el limitador usa una IP que el cliente no puede falsificar" queda **sin cumplir** hasta que la usuaria ajuste `TRUSTED_PROXY_HOPS`.

## Issues Encountered

- `TRUSTED_PROXY_HOPS=1` no corresponde a la cadena de proxies de Render (supuesto A2 refutado; detalle arriba).
- Cloudflare elimina `X-Accel-Buffering`, y eso no tiene impacto.
- Observación del agente, fuera de alcance: para listar casos, el modelo llama `proveedor_leer_solicitud` con `caso: "consulta"` y usa el error `CASO_NO_ENCONTRADO` (que trae la lista) como descubrimiento. Responde bien, pero gasta una llamada de herramienta que falla. Queda como nota para los planes del prompt o de la UI.

## Instrucciones para la usuaria (pendientes)

1. **Medir los saltos (preferido).** En Render → servicio → Environment, pon `LOG_LEVEL=debug` (si no estaba) y guarda. Esto reinicia el servicio y limpia el bloqueo. Avísale al orquestador para que mande `curl -X POST -H "Content-Type: application/json" -d '{"codigo":"x"}' https://registro-proveedor-bfnt.onrender.com/api/acceso`, una vez sin `X-Forwarded-For` y otra con `-H "X-Forwarded-For: 203.0.113.9"`. En Render → Logs, busca el evento `http_client_ip_resolved` y anota `entradasXff` en ambos casos. Si `LOG_LEVEL=debug` ya estaba puesto, esas líneas ya existen en los logs entre las 01:44:31Z y las 01:45:40Z de hoy: la de las 01:45:35Z en adelante es sin cabecera y la de las 01:44:56Z es con una entrada falsificada.
   - Si sin cabecera da **N ≥ 2** y con una falsificación da **N + 1**, pon `TRUSTED_PROXY_HOPS=N`.
   - Si sin cabecera da **0** (Render no manda la cabecera), ningún valor de saltos sirve. Hace falta un cambio de código que tome la IP de una cabecera confiable del borde (por ejemplo `CF-Connecting-IP` o `True-Client-IP`, si Render la reenvía). Eso pide un plan nuevo (Regla 4).
2. **Alternativa sin logs.** Pon `TRUSTED_PROXY_HOPS=2` y deja que el servicio se reinicie. Después hay que repetir el sondeo: cinco errados con `X-Forwarded-For` distintos, un sexto, y diez errados sin cabecera. Es correcto si desde el sexto todo da 429 de forma determinista. Si aparecen 401 mezclados, el valor es bajo (prueba 3). Si con las falsificaciones nunca llega 429, el valor es alto.
3. **Después de medir**, actualiza `TRUSTED_PROXY_HOPS` en `render.yaml` al valor final. Si no, una sincronización del Blueprint lo devuelve a "1". El push lo decide la usuaria.
4. **Vuelve a poner `LOG_LEVEL=info`** en Render cuando termine la medición.
5. **Playwright en el navegador (opcional).** El streaming ya está probado con fetch y `curl -N`. Una pasada con Playwright solo agrega la vista en producción. Desde esta máquina hay que esperar a que venza el bloqueo (cerca de las 02:01Z) o al reinicio del paso 1.

## User Setup Required

Sí. Ver "Instrucciones para la usuaria" (`TRUSTED_PROXY_HOPS` y `LOG_LEVEL` en el panel de Render).

## Next Phase Readiness

- 03-12 puede seguir. No depende del valor de saltos.
- **Bloqueador para la defensa:** con `TRUSTED_PROXY_HOPS=1` los evaluadores comparten el contador de fallos. Hay que resolverlo antes de publicar el código de acceso en el README (03-16 o 03-19).
- El servicio duerme a los 15 min. Hay que calentarlo antes de la defensa.

## Self-Check: PASSED

- FOUND: Dockerfile, render.yaml, .dockerignore, tests/despliegue/contrato-despliegue.test.ts, tests/seguridad/clave.test.ts
- FOUND: 7ccf0b9 y 17745b3 son ancestros de HEAD
- El código de acceso no aparece en este SUMMARY

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
