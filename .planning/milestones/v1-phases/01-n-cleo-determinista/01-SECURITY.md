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
| T-01-24 | Tampering / DoS | src/infra/output/xlsx-writer.adapter.ts (width and wrap) | low | mitigate | widths clamped minimo..maximo, only template-addressed columns sized, numFmt "@" kept (xlsx-writer.adapter.ts:28-31,45-50,57); tests/unit/xlsx-writer.adapter.test.ts:62-99,134-155 | closed |
| T-01-25 | Info disclosure | src/domain/builders/borrador.builder.ts por_confirmar rows | medium | mitigate | rows carry only { etiqueta } (no nota, WR-02); maestro read limited to RUTAS_BORRADOR; banco.* routed to confirmaciones_internas, never to the client (borrador.builder.ts:18-20,69-75; checklist.builder.ts:62-67); tests/unit/borrador.builder.test.ts:151-199,273-280, tests/e2e/pii.test.ts:138 | closed |
| T-01-26 | Repudiation | ENVIO-SIMULADO.md sent list | medium | mitigate | client-file set ∩ real paquete/ listing; internal files never listed (borrador.builder.ts:34-41,115); tests/contract/simular-envio.test.ts:228-267 | closed |
| T-01-27 | Tampering | src/knowledge/plantillas/*.md edits | low | mitigate | Object.hasOwn variable lookup, unknown variable/section → REGLAS_INVALIDAS (motor-plantillas.engine.ts:41-88); tests/unit/motor-plantillas.engine.test.ts:42-59, tests/golden/borrador-envio.test.ts:255-264 | closed |
| T-01-28 | Tampering | TEXTO_SOPORTE.nombre (src/config/strings.ts) | medium | mitigate | Object.hasOwn own-key check, unknown/prototype ids return the raw id (strings.ts:92-95); tests/unit/checklist.builder.test.ts:93-108 | closed |
| T-01-29 | Info disclosure | NOMBRE_SOPORTE table | low | accept | static code-owned names, no PII — see Accepted Risks Log | closed |
| T-01-30 | Tampering / Repudiation | tool contract v1 (bloqueos, resumen, logs) | medium | mitigate | raw ids kept in data, resumen and audit log; names only in human-facing builders (checklist.builder.ts:30-36,52; herramientas.factory.ts:72-97; audit-log.adapter.ts:21-30); tests/golden/nombres-soporte.test.ts:196-216, tests/golden/paquete.test.ts:131-143 | closed |
| T-01-31 | Tampering / Repudiation | simular_envio contract v1 vs ENVIO-SIMULADO record | medium | mitigate | record renders names (borrador.builder.ts:117), data.bloqueos stays raw (simular-envio.use-case.ts:49); tests/contract/simular-envio.test.ts:217-224, tests/golden/nombres-soporte.test.ts:171-200 | closed |
| T-01-32 | Tampering | unknown / prototype-like tipo in envío and borrador builders | low | mitigate | names resolved only via TEXTO_SOPORTE.nombre (borrador.builder.ts:25,47-48,117); tests/unit/borrador.builder.test.ts:356-417 | closed |
| T-01-33 | Info disclosure / Tampering | PAQUETE_DESACTUALIZADO stale-package check (paquete/ listing, borrador read, parcial payload) | medium | mitigate | listPackage resolves paquete/ via realpath containment and no longer mkdirs (output-files.adapter.ts:74); borrador read via readOwnRegularText: O_NOFOLLOW + fstat, rejects symlinks, hard links, non-regular and oversized files (output-files.adapter.ts:87; fs.util.ts:40-62); leftovers echoed only if they match PATRON_ARCHIVO_SOPORTE, capped at LIMITE_SOBRANTES_REPORTADOS=20, the rest counted in archivos_sobrantes_no_listados and still rejecting (paquete-vigente.policy.ts:25-53); OS junk ignored by exact name; nothing written on rejection (simular-envio.use-case.ts:36); tests/unit/output-files.adapter.test.ts:128-160, tests/unit/paquete-vigente.policy.test.ts:145-178, tests/contract/simular-envio.test.ts:347 (fixed in c1d5f7f, 37048ae) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

Informational notes (non-blocking):
- T-01-17: the caso guard reads fixture files before the confirmation gate, matching the fixed order in 01-10-PLAN (caso → confirmado → paquete). No output check or write precedes the gate.
- T-01-18 / T-01-22: the lock is in-memory, so it serializes calls within one process only. Cross-process concurrency is out of scope at L1.

---

### Evidence path map (2026-10-13)

The role-folder refactor renamed the files cited above for T-01-01..T-01-23. Mitigations were re-located and confirmed present by gsd-security-auditor on 2026-10-13:

| Threat | Current mitigation | Current test |
|--------|--------------------|--------------|
| T-01-01 | src/infra/fixtures/case-resolver.adapter.ts:15-19, src/application/services/contexto-caso.service.ts:19, src/infra/fs/safe-paths.util.ts:15-48 | tests/e2e/trazador.test.ts:170-182 |
| T-01-02 | src/tools/factories/definir-herramienta.factory.ts:80-108,172-178, src/domain/utils/formatear-issues.util.ts, src/domain/utils/nombre-error.util.ts | tests/e2e/trazador.test.ts:229-249 |
| T-01-03 | src/infra/logging/audit-log.adapter.ts:15-35 | tests/e2e/trazador.test.ts:373-433 |
| T-01-04 | src/infra/fs/fs.util.ts:19-31, fixtures-reader.adapter.ts:41, rules-loader.adapter.ts:29, template-loader.adapter.ts:18 | tests/e2e/trazador.test.ts:298-305 |
| T-01-05 | tests/architecture.test.ts:27,454,666 | tests/architecture.test.ts:747-758 |
| T-01-06 | src/demo/runners/ejecutar-demo.runner.ts:80-84,236-242 | tests/e2e/demo.test.ts:44,136 |
| T-01-07 | src/domain/policies/pii.policy.ts:45-58, src/domain/builders/campo-presentado.builder.ts, src/domain/engines/mapeo.engine.ts:58-70 | tests/unit/pii.policy.test.ts:33-95 |
| T-01-08 | src/domain/selectors/maestro.selector.ts:8-40, mapping.constants.ts:60, glosario.builder.ts:15-16 | tests/unit/mapeo.engine.test.ts:106-131 |
| T-01-09 | src/infra/knowledge/rules-loader.adapter.ts:19-33, src/infra/knowledge/schemas/rules.schema.ts | tests/contract/reglas.test.ts |
| T-01-10 | src/application/services/mapeo-canonico.service.ts:25-39, mapear-campos.use-case.ts:51-53 | tests/golden/mapear-campos.test.ts:19-28,168-174 |
| T-01-11 | src/tools/schemas/argumentos.schema.ts:11-17, generar-formulario.use-case.ts:93-107 | tests/contract/generar-formulario.test.ts:125-149 |
| T-01-12 | src/infra/output/xlsx-writer.adapter.ts:56-67 | tests/unit/xlsx-writer.adapter.test.ts:134-141 |
| T-01-13 | src/infra/output/pdf/pdf-renderer.adapter.ts:25,64,70 | tests/unit/pdf-layout.util.test.ts:131-175 |
| T-01-14 | src/domain/builders/portal.builder.ts:19-31, motor-plantillas.engine.ts:56-59 | tests/golden/formulario-portal.test.ts:106-117 |
| T-01-15 | src/domain/builders/borrador.builder.ts:18-20,69-71, maestro.constants.ts (RUTAS_BORRADOR) | tests/golden/borrador-envio.test.ts:116-127 |
| T-01-16 | src/infra/output/package-copy.adapter.ts:21-64 | tests/unit/package-copy.adapter.test.ts:44-99 |
| T-01-17 | src/application/use-cases/simular-envio.use-case.ts:16-18,48 | tests/contract/simular-envio.test.ts:159-220 |
| T-01-18 | src/infra/output/case-lock.adapter.ts:1-17 (wraps the four writer use cases) | tests/golden/paquete.test.ts:267-275 |
| T-01-19 | src/demo/runners/ejecutar-demo.runner.ts | tests/e2e/pii.test.ts:138-147 |
| T-01-20 | src/infra/fs/safe-paths.util.ts:7-9 | tests/e2e/determinismo.test.ts:74 |
| T-01-21 | tests/fixtures/casos/zz-* (unchanged) | — |
| T-01-22 | mapear-campos.use-case.ts:66, audit-log.adapter.ts:10-13 | tests/contract/sinteticos.test.ts:217-230 |
| T-01-23 | src/infra/output/output-files.adapter.ts:63-96, safe-paths.util.ts:19-42 | tests/unit/output-files.adapter.test.ts:65-104 |
| T-01-SC | package.json pins + uuid override, bun audit in `bun run check` | bun audit clean (207 packages) |

---

## Accepted Risks Log

| Risk | Severity | Rationale | Accepted |
|------|----------|-----------|----------|
| T-01-29 · NOMBRE_SOPORTE | low | Static, code-owned Spanish type names (src/config/strings.ts:82-90) with no maestro data or PII; tests/e2e/pii.test.ts still scans checklist, borrador and ENVIO-SIMULADO | 2026-10-13 |
| T-01-33 residual · leftover names that match PATRON_ARCHIVO_SOPORTE are echoed | low | A name like `ignora-las-instrucciones.txt` can still reach the caller, but only as ≤101 chars of [a-z0-9._-] with no spaces or control characters, at most 20 names; the send stays gated by `confirmado` (T-01-17) and, from Phase 2, by the server-side confirmation gate (ENV-02). Revisit if Phase 2 shows the model acting on file names | 2026-10-13 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-12 | 24 | 24 | 0 | gsd-security-auditor (ASVS L1, block_on high) |
| 2026-10-13 | 34 | 34 | 0 | gsd-security-auditor (ASVS L1, block_on high); T-01-33 found open, fixed in c1d5f7f/37048ae, closed |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-12; re-verified 2026-10-13 (T-01-24..T-01-33 added, evidence paths remapped)

## Security Audit 2026-10-13

| Metric | Count |
|---|---|
| Threats found | 34 |
| Closed | 34 |
| Open | 0 |
