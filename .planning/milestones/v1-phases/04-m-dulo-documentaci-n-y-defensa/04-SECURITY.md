---
phase: "04"
slug: "m-dulo-documentaci-n-y-defensa"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_total: 24
threats_closed: 24
threats_open: 0
threats_open_non_blocking: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-10-16"
---

# Phase 04 — Security

> Contrato de seguridad de la fase: registro de amenazas, riesgos aceptados y rastro de auditoría.
> El registro sale de los 8 bloques `<threat_model>` de 04-01..04-08 (T-04-01..T-04-23 y T-04-SC, 24 amenazas únicas). Ningún SUMMARY trae una sección `## Threat Flags`. El auditor (gsd-security-auditor, ASVS L1, block_on high) verificó cada mitigación contra el código de `HEAD` `9642da4`, que incluye las 12 correcciones de 04-REVIEW-FIX.md y el cierre de brechas 04-08.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Fuentes del repo → módulo generado | `agent/prompt.md` y `src/knowledge/registro-proveedor.md` se copian a `modulo/agent.md` y `SKILL.md`, que un host externo trata como piezas propias de la app | Prompt del sistema y conocimiento del proceso |
| Módulo → host de agentes (OpenCode) | El host respeta los permisos del frontmatter y de `opencode.json`, y llama a las herramientas sin la compuerta de confirmación del servidor | Permisos `edit`/`bash`, llamadas a `proveedor_simular_envio` |
| Config del repo → host | `opencode.json` y `.opencode/` deciden qué carga el host | Rutas de prompt, skills y herramientas |
| Marketplace de GitHub Actions → runner de la CI | Código de terceros corre con el checkout del repo | Checkout, `GITHUB_TOKEN` de solo lectura |
| Resultado de la CI → Render | Render decide si despliega según los checks del commit | Estado de los checks |
| Shell del operador → pre-flight | El código de acceso entra por el entorno | Código de acceso (secreto) |
| Pre-flight → servicio público | El script es un cliente autenticado de la API de producción | `Authorization: Bearer`, turnos del guion |
| Servicio público → pre-flight | Las respuestas y los frames SSE son entrada no confiable | JSON de health, config, archivos y eventos SSE |
| `.env` local (clave prepaga) → corrida de costo en vivo | La corrida gasta dinero real con la clave de la usuaria | Clave del proveedor (secreto) |
| Corrida en vivo → evidencia commiteada | Lo que se escribe en el repo lo ven los evaluadores | Números de uso, ids de caso, modelo |
| Documentación del repo → evaluadores | README, `docs/` y SOLUCION.md los leen personas ajenas al proyecto | Texto, ejemplos, código de acceso (D-94) |
| Archivo de token ignorado → README commiteado | El código de acceso cruza de `.qa/render.token` al historial de git | Código de acceso |
| Repo → máquina del evaluador | La suite corre en la copia que baje el evaluador, que puede no tener `.git` ni git | Resultado de `bun test` |
| Export temporal → shell local | La verificación sin git extrae `HEAD` en un directorio temporal y corre `bun install` y `bun test` | Lockfile existente |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-04-01 | Tampering | `modulo/agent.md`, `SKILL.md` | medium | mitigate | Igualdad byte a byte contra `archivosDelModulo` y pruebas de deriva (`tests/modulo/generador.test.ts:182-254`); la CI corre `bun test` en cada push (`ci.yml:30-31`, `ci.test.ts:131-139`); `.gitattributes` fija LF y el generador escribe por temporal + rename (`generar-modulo.runner.ts:90-103`) | closed |
| T-04-02 | Elevation of privilege | frontmatter de `modulo/agent.md` | high | mitigate | `edit` y `bash` salen de `PERMISO_MODULO.DENEGADO` (`modulo.builder.ts:28-30`, `modulo.constants.ts:25-27`); prueba del frontmatter (`generador.test.ts:192-199`); `opencode.json` con los mismos permisos (`opencode.test.ts:82-83`) | closed |
| T-04-03 | Elevation of privilege | `proveedor_simular_envio` por el módulo sin la compuerta (D-80) | high | mitigate | Reexportación del mismo objeto (`modulo/tools/proveedor.ts:1-7`; `herramientas.test.ts:49-54`, `toBe`); rechazo sin `confirmado: true` (`simular-envio.use-case.ts:18`; `herramientas.test.ts:62-75`); límite documentado (`modulo/README.md:31`, `src/knowledge/registro-proveedor.md:11,13`) | closed |
| T-04-04 | Tampering | `.opencode/tools/proveedor.ts` hacia el interior de la app | medium | mitigate | Capas `modulo: ["proveedor"]` y `opencode: ["modulo"]` (`architecture.test.ts:132-133,330-335`); muestras de violación (`architecture.test.ts:1415-1466`) | closed |
| T-04-05 | Information disclosure | importar el módulo lee el entorno o secretos | medium | mitigate | Import con `env: {}` y `--no-env-file` para `modulo/` y `.opencode/` (`herramientas.test.ts:34-46,56-60,89-93`); `readToolEnv` solo dentro de `crearEntorno`, por llamada (`entorno.wiring.ts:127`) | closed |
| T-04-06 | Tampering | `actions/checkout`, `oven-sh/setup-bun` | high | mitigate | SHA de 40 hex (`ci.yml:19,23,42,46`); `ci.test.ts:12-16,170-174`; releases del 2026-07-20 y 2026-03-14, más de 7 días (`04-RESEARCH.md:141-144`) | closed |
| T-04-07 | Information disclosure | logs de la CI | medium | mitigate | `permissions: contents: read` (`ci.yml:7-8`; `ci.test.ts:117-121`); sin `secrets` ni modelo en vivo (`ci.test.ts:184-189`); `persist-credentials: false` en ambos checkouts (`ci.yml:20-21,43-44`; `ci.test.ts:162-168`, IN-06) | closed |
| T-04-08 | Denial of service | deploy bloqueado por un advisory de terceros | medium | mitigate | Job `auditoria` propio con `continue-on-error` en el paso y anotación `::warning` (`ci.yml:36-57`; `ci.test.ts:123-129,141-160`) | closed |
| T-04-09 | Tampering | commit roto desplegado antes de la defensa | medium | mitigate | `autoDeployTrigger: checksPass` (`render.yaml:8`; `contrato-despliegue.test.ts:263,267-270`); vuelta atrás `autoDeployTrigger: commit` documentada (`docs/entrega.md:23`) | closed |
| T-04-10 | Information disclosure | código de acceso en argv, logs o reporte | high | mitigate | `parseArgs` solo con `url` y `guion` (`preflight.runner.ts:443-456`); código solo de `PREFLIGHT_ACCESS_CODE` (`env.ts:423-436`); https o http solo a loopback y origen sin ruta (`env.ts:144-150,411-421`); cada corrida de prueba exige que ninguna línea impresa contenga el código (`preflight.test.ts:149`) y argv no se repite (`preflight.test.ts:267-268,332-341`) | closed |
| T-04-11 | Denial of service | autobloqueo de la IP de la defensa | high | mitigate | Un solo `GET /api/config` con Bearer; 401 y 429 son finales, sin reintento (`preflight.runner.ts:167-190`); health sin credencial (`preflight.runner.ts:131-141`); `preflight.test.ts:175-190` cuenta un pedido | closed |
| T-04-12 | Tampering | health, config, lista de archivos o frames SSE malformados | medium | mitigate | Esquemas zod con `satisfies` (`src/cli/schemas/preflight.schema.ts:15-63`); cada fallo de parseo corta el paso (`preflight.runner.ts:141,184,200-258,367`); pruebas por rama (WR-01) | closed |
| T-04-13 | Denial of service (cost) | tokens gastados por un calentamiento de rutina | medium | mitigate | `--guion` por defecto `false` y solo entonces `correrGuion` (`preflight.runner.ts:451,423-428`); el turno 2 reusa la sesión (`preflight.runner.ts:398,414`); `preflight.test.ts:170-172` sin `POST` ni `/api/chat` | closed |
| T-04-14 | Information disclosure | `docs/evidencia/costo-por-caso.json` | high | mitigate | Esquema `strictObject` de solo números, ids, modelo y URL de precios (`evidencia-costo.test.ts:44-84`); escaneo de `sensiblesDelProyecto` y de la clave (`evidencia-costo.test.ts:226-231`; `costo-por-caso.test.ts:114-116`) | closed |
| T-04-15 | Denial of service (cost) | corrida en vivo con la clave personal | medium | mitigate | `describe.skipIf(COSTO_EN_VIVO !== "1")`, separado de `LLM_EN_VIVO` (`costo-por-caso.test.ts:52`; scripts `costo` y `test:vivo` en `package.json`); fuera de la CI (`ci.test.ts:40,184-189`); sin sobreescribir topes ni `max_tokens` (`costo-por-caso.test.ts:64-69`) | closed |
| T-04-16 | Information disclosure | código de acceso literal en `README.md` (D-94) | medium | accept | Ver Accepted Risks Log (AR-01) | closed |
| T-04-17 | Information disclosure | clave del LLM o secreto HMAC en la documentación | high | mitigate | `asignacionesSecretas` sobre `LLM_API_KEY`, `DEEPSEEK_API_KEY` y `ACCESS_TOKEN_SECRET` más `sensiblesDelProyecto` y la clave del entorno en README y `docs/entrega.md` (`readme.test.ts:20,82-89,186-196`); la prueba del código usa aserciones booleanas (`readme.test.ts:112-120`); `.qa/*.token` ignorado (`.gitignore:13`, `.dockerignore:12`) | closed |
| T-04-18 | Repudiation | afirmaciones de costo (§4) y cobertura (§8) de SOLUCION.md | medium | mitigate | §4 número a número contra la evidencia o la frase pendiente (`solucion.test.ts:153-170`); §8 con hecho/parcial/no hecho (`solucion.test.ts:185-193`; `SOLUCION.md:181`) | closed |
| T-04-19 | Information disclosure | ejemplos de SOLUCION.md | medium | mitigate | `sensiblesDelProyecto` y la clave del entorno sobre SOLUCION.md (`solucion.test.ts:200-206`) | closed |
| T-04-20 | Tampering | condición de skip de `tests/modulo/generador.test.ts` | low | mitigate | Skip solo sin git o fuera de la raíz del proyecto (`generador.test.ts:138-144,165`); chequeo sin git siempre activo (`generador.test.ts:157-163`); 0 skip en el checkout (corrida del auditor); mutación `eol=crlf` detectada sin git (04-08-SUMMARY D2) | closed |
| T-04-21 | Repudiation | `ENVIO-SIMULADO.md` de una corrida anterior visto en la defensa | low | accept | Ver Accepted Risks Log (AR-02) | closed |
| T-04-22 | Information disclosure | ediciones de `docs/entrega.md`, SOLUCION.md y README.md | low | mitigate | `asignacionesSecretas` pasó a `tests/helpers/documentos.helper.ts` y ahora corre sobre SOLUCION.md (`solucion.test.ts`), sobre README, sobre cada `docs/**/*.md` y sobre `modulo/README.md` (`readme.test.ts`, con `documentosMarkdown`). Commit 6c54c18 | closed |
| T-04-23 | Tampering | verificación con export sin git (`bun install` en un temporal) | low | mitigate | `git archive HEAD`, `mktemp -d`, `trap "rm -rf"` en EXIT, rechazo con `EXPORT_DENTRO_DE_GIT` si cae en un work tree y `--frozen-lockfile` (`04-08-PLAN.md:170,174`); sin restos `sin-git-*` en `$TMPDIR` | closed |
| T-04-SC | Tampering | instalaciones npm | high | mitigate (04-03, 04-08) / accept (04-01, 04-02, 04-04..04-07) | `dependencies`, `devDependencies` y `bun.lock` sin cambios desde `ebb4945` (solo scripts nuevos); la CI instala con `--frozen-lockfile` (`ci.yml:27,50`; `ci.test.ts:22,131-160`); `bun audit` sin vulnerabilidades (269 paquetes); ver AR-03 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-04-16 | El código de acceso va literal en el README, como pide el PRD §9.2 (D-94, `README.md:13-16`). El repo es privado y solo lo ven los evaluadores invitados (D-89; la API de GitHub sin autenticar responde 404 para `alejotorreshi/retoeli1`). `ACCESS_CODE` se rota en Render después de la evaluación, y el README se actualiza porque el valor queda en el historial (D-99, `docs/entrega.md:7,21,29`). La rotación también invalida las cookies firmadas, porque la clave de firma se deriva del código (`server.wiring.ts:108`) | elianatorres5772 (D-94, D-89, D-99 en 04-CONTEXT.md) | 2026-10-15 |
| AR-02 | T-04-21 | `out/<caso>/` es del caso y no de la sesión (PRD), así que una sesión nueva puede ver el paquete y el `ENVIO-SIMULADO.md` de una corrida anterior hasta que su turno 1 los reconstruye. No se envía nada: la compuerta solo pide confirmación por un paquete armado en la misma sesión (`paquetesConocidos`, `ejecutar-turno.service.ts:47`). `--guion` y los ensayos van la víspera (`docs/entrega.md:25-26,31-33`), y el riesgo y su arreglo `out/<sesión>/<caso>/` están en SOLUCION.md §10 (`SOLUCION.md:243,259`) | elianatorres5772 (plan 04-08, G-04-2) | 2026-10-16 |
| AR-03 | T-04-SC (planes 04-01, 04-02, 04-04, 04-05, 04-06, 04-07) | Estos planes no instalan ni actualizan paquetes; `eventsource-parser` ya estaba fijado y aprobado en la fase 3. Se verificó igual: el lockfile no cambió en toda la fase | elianatorres5772 (planes 04-01..04-07) | 2026-10-15 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-16 | 24 | 23 | 0 (1 non-blocking, low) | gsd-security-auditor (ASVS L1, block_on high); `bun test tests/docs tests/modulo tests/cli tests/despliegue tests/architecture.test.ts tests/seguridad`: 235 pass / 0 fail / 0 skip en 12 archivos; `bun audit` sin vulnerabilidades (269 paquetes) |

Notas del auditor:
- **T-04-22 (cerrada en 6c54c18).** El auditor la encontró abierta por debajo del umbral. El orquestador la cerró con /gsd-fast: `asignacionesSecretas` vive en el helper compartido y se aplica a SOLUCION.md, README, `docs/**/*.md` y `modulo/README.md`. También cubre la recomendación de la nota sobre T-04-17. Después, `bun run check` terminó con 0 y `bun test` dio 0 fail (2486 tests).
- **T-04-17 (cerrada, cobertura más estrecha que el componente).** La guarda automática cubre README, `docs/entrega.md` y SOLUCION.md (más la evidencia de costo), como fija el criterio de aceptación de 04-06. `docs/arquitectura.md`, `docs/convenciones.md`, `docs/estructura.md`, `docs/limites-del-demo.md`, `docs/plantillas.md` y `modulo/README.md` no tienen escaneo de secretos. El auditor los escaneó a mano el 2026-10-16 con la clave real del `.env` local y `sensiblesDelProyecto` (25 valores), sin imprimir valores: 0 fugas, 0 asignaciones y ningún patrón `sk-`. Se recomienda extender `test.each` a `docs/**/*.md` y `modulo/README.md` para que una regresión futura no pase.
- Correcciones de 04-REVIEW-FIX.md que refuerzan el registro: IN-06 (`persist-credentials: false`, T-04-07), IN-08 (`PREFLIGHT_URL` solo como origen, T-04-10), IN-01 (`--no-env-file` en los imports con entorno vacío, T-04-05), WR-02 (`.gitattributes`, T-04-01), IN-07 (raíz desde `import.meta.dir` y escritura atómica, T-04-01) y WR-01 (una prueba por rama del validador del guion, T-04-12). La desviación de 04-04 (http solo a loopback) también refuerza T-04-10.
- `bun audit` salió de `bun run check` y quedó en su propio job de la CI que no bloquea (T-04-08). Sigue corriendo en cada push.
- 04-REVIEW.md es anterior a 04-08. Los cambios de 04-08 son pruebas y documentación, y no agregan superficie de ataque.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-16 (24/24 cerradas; T-04-22 se cerró en 6c54c18 después de la auditoría)

## Security Audit 2026-10-16

| Metric | Count |
|---|---|
| Threats found | 24 |
| Closed | 24 |
| Open | 0 |
