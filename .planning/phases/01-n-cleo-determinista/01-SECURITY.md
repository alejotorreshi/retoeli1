---
phase: "01"
slug: "n-cleo-determinista"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-12"
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| caller (LLM, test, modulo/) → tool execute | args and ctx are untrusted | caso id, labels, rutas-only mapping, confirmado flag |
| caller (LLM) → generar_formulario args | the mapping may be tampered with or carry values | etiqueta / estado / ruta items |
| caller (LLM) → simular_envio | the model may try to send without human confirmation | confirmado boolean |
| tool → filesystem (fixtures) | file names derived from `caso`; fixture contents validated before use | maestro (PII), plantillas, soportes index |
| fixtures (maestro, glosario) → domain | JSON with arbitrary keys | sensitive master data |
| src/knowledge (editable rules and templates) → tools/outputs | edits are untrusted input | rule texts, template variables |
| index.json (data) → filesystem copy | archivo names could try to escape | soporte file names |
| domain/tool output → caller (LLM) | output leaves the process; must carry no PII | masked values, codes, counts |
| tools → console / logs / out/ files | read by humans and, from Phase 2, by the LLM | resumen, codes, relative paths |
| maestro values → xlsx / PDF consumers | Excel interprets formulas; pdf-lib can crash on unsupported glyphs | cell and PDF text |
| outputs → human/client | borrador and checklist shared outside the analyst's machine | contact name, razón social, pending items |
| concurrent callers → out/<caso> | races on mapeo.json, logs and paquete/ | output files |
| repo root → demo cleanup / D-12 cleanup | recursive deletes under the project root | out/ tree |
| package registry → repo | third-party code enters through bun install | npm packages |
| developer machine / tests/fixtures → repo | stray metadata or real data could be committed | fixtures |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Tampering / Info disclosure | src/infra/salida/rutas-seguras.ts | high | mitigate | PATRON_CASO + realpath containment (rutas-seguras.ts:20-24); trazador.test.ts:167-180 | closed |
| T-01-02 | Info disclosure | src/tools/define-tool.ts error path | medium | mitigate | throws → ERROR_INTERNO, only error.name to stderr, catalog messages, capped issues (define-tool.ts:45-47,79-86,139-146; issues.ts:4-12); trazador.test.ts:130-136,227-249 | closed |
| T-01-03 | Info disclosure | src/infra/bitacora.ts | medium | mitigate | casoSeguro gate, fixed log fields (bitacora.ts:12-33); marker test trazador.test.ts:418-427 | closed |
| T-01-04 | DoS | src/infra/fixtures/lector.ts | low | mitigate | stat size limit before read (lector.ts:52-53; reglas.ts:87-88), strict zod; trazador.test.ts:296-303 | closed |
| T-01-05 | Elevation of privilege | src/**, demo.ts | high | mitigate | no-shell scanner (architecture.test.ts:84-96,147-150), proven on samples (:228-240) | closed |
| T-01-06 | Tampering | src/demo/ejecutar-demo.ts cleanup | high | mitigate | package.json + exact out/ target checks before node:fs rm (ejecutar-demo.ts:86-96,217-225); demo.test.ts:41-49,133-142 | closed |
| T-01-07 | Info disclosure | src/domain/pii.ts presentarCampo | high | mitigate | default "[dato oculto]", no valor key, closed note variables (pii.ts:17,115-135); pii.test.ts:34-165 | closed |
| T-01-08 | Tampering | src/domain/mapeo.ts leerRuta / glossary | medium | mitigate | Map index, ^[a-z_]+$ segments with deny-set, own-property walk, scalar leaves (mapeo.ts:56-93); mapeo.test.ts:95-107 | closed |
| T-01-09 | Tampering | src/infra/knowledge/reglas.ts | medium | mitigate | strict zod schema → REGLAS_INVALIDAS, regex-locked template paths, PII policy in code (reglas.ts:26-111); contract/reglas.test.ts:96-123 | closed |
| T-01-10 | Info disclosure | out/<caso>/mapeo.json | medium | mitigate | written only via presentarCampo (mapear-campos.ts:70-85); golden mapear-campos.test.ts:289-302 | closed |
| T-01-11 | Tampering | src/application/generar-formulario.ts | high | mitigate | strict rutas-only items, canonical recompute → MAPEO_INCONSISTENTE, values re-read from maestro (argumentos.ts:17-30; generar-formulario.ts:42-104); contract/generar-formulario.test.ts:63-172 | closed |
| T-01-12 | Tampering | src/infra/salida/xlsx.ts | medium | mitigate | numFmt "@" + plain strings (xlsx.ts:6,21,28); formulario-xlsx.test.ts:167-189 | closed |
| T-01-13 | DoS | src/infra/salida/pdf/render.ts | low | mitigate | sanearWinAnsi on every measured/drawn string (render.ts:13-37); pdf-layout.test.ts | closed |
| T-01-14 | Info disclosure | src/domain/portal.ts + valores-portal.md | medium | mitigate | allowlisted context, unknown variable → REGLAS_INVALIDAS (portal.ts:14-55); formulario-portal.test.ts:108 | closed |
| T-01-15 | Info disclosure | src/domain/borrador.ts + borrador-correo.md | high | mitigate | no banco field, only RUTAS_BORRADOR read (borrador.ts:6-41); borrador-envio.test.ts:19,106-146 | closed |
| T-01-16 | Info disclosure / Tampering | src/infra/salida/copias.ts | high | mitigate | allowlisted destinations, PATRON_ARCHIVO_SOPORTE, realpath source containment (copias.ts:13-67); unit/copias.test.ts:44-140 | closed |
| T-01-17 | Elevation of privilege / Repudiation | src/application/simular-envio.ts | high | mitigate | confirmado !== true → CONFIRMACION_REQUERIDA before any output check or write; only ENVIO-SIMULADO.md written; every attempt logged (simular-envio.ts:19,36); contract/simular-envio.test.ts:76-170. Server-side gate is Phase 2 (ENV-02) | closed |
| T-01-18 | Tampering | concurrent writers on the same caso | low | mitigate | all four writers inside entorno.candado (mutex.ts:7-17); golden/paquete.test.ts:227-235. In-process lock only | closed |
| T-01-19 | Info disclosure | demo stdout, responses, logs, checklist, borrador, envío | high | mitigate | demo prints counts/paths/states/codes only (ejecutar-demo.ts:135-202); e2e/pii.test.ts full-corpus scan with positive control | closed |
| T-01-20 | Info disclosure | relative paths in data and outputs | low | mitigate | rutaRelativa (rutas-seguras.ts:44-46); e2e/determinismo.test.ts:71-84 | closed |
| T-01-21 | Info disclosure | tests/fixtures/casos/zz-* | low | mitigate | synthetic data only (.example domains, "No contiene datos reales"); 9 files checked | closed |
| T-01-22 | Tampering | mapeo.json and log.jsonl under concurrent mapear_campos | medium | mitigate | per-caso lock + one appendFile per line (mapear-campos.ts:113; bitacora.ts:9); contract/sinteticos.test.ts:180-197 | closed |
| T-01-23 | Tampering | src/infra/salida/archivos.ts D-12 recursive delete (threat flag from 01-07) | medium | mitigate | caso regex, realpath containment in out/, fixed target names paquete and ENVIO-SIMULADO.md (archivos.ts:70-98); unit/salida.test.ts:66-110 | closed |
| T-01-SC | Tampering | npm installs | high | mitigate | exact pins, committed bun.lock, uuid override → 11.1.1, `bun audit --audit-level=moderate` in `bun run check` (clean, 207 packages), human legitimacy gate in 01-01-SUMMARY | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

Informational notes (non-blocking):
- T-01-17: the caso guard reads fixture files before the confirmation gate, matching the fixed order in 01-10-PLAN (caso → confirmado → paquete). No output check or write precedes the gate.
- T-01-18 / T-01-22: the lock is in-memory, so it serializes calls within one process only. Cross-process concurrency is out of scope at L1.

---

## Accepted Risks Log

No accepted risks.

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-12 | 24 | 24 | 0 | gsd-security-auditor (ASVS L1, block_on high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-12
