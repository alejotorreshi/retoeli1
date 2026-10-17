---
status: diagnosed
trigger: "G-01-H4c: borrador-correo.md shows snake_case support ids like certificado_cumplimiento_tributario instead of human-readable Spanish names"
created: 2026-10-13T03:00:00Z
updated: 2026-10-13T03:20:00Z
goal: find_root_cause_only
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (deterministic, reproduces on every demo run; presentation-layer design gap, not a runtime fault)
hypothesis: CONFIRMED. The support identifier `tipo` (machine key, ^[a-z0-9_]{1,64}$) flows verbatim from SoporteEvaluado into every human-facing render; no display-name lookup exists in domain, config or knowledge.
next_action: none (diagnose-only). Hand to plan-phase --gaps for G-01-H4c.

reasoning_checkpoint:
  hypothesis: "borrador/checklist/ENVIO-SIMULADO show snake_case ids because the builders copy SoporteEvaluado.tipo (the raw key from soportes-exigidos.json) straight into template variables ({{tipo}}, {{texto}}, {{bloqueo}}, {{motivo}}), and no typed tipo->display-name table exists anywhere (strings.ts, reglas.json, SoporteEvaluado)"
  confirming_evidence:
    - "borrador.builder.ts:23 (soportes_adjuntos tipo), :33 (ausentes -> pendientes), :34 (vencidos via TEXTO_BORRADOR.pendienteVencido) pass soporte.tipo unchanged"
    - "checklist.builder.ts:15/:17 (bloqueos), :48 (table row), :71/:74 (acciones) pass soporte.tipo unchanged; construirDatosEnvio (borrador.builder.ts:82) reuses checklist.bloqueos for ENVIO-SIMULADO"
    - "Marker experiment: renaming tipo rut -> zz_marcador_rut made the borrador print '- zz_marcador_rut (rut-2026.txt)' and the checklist row '| zz_marcador_rut |' verbatim; changing an index descripcion to a marker surfaced nowhere in out/"
  falsification_test: "If any lookup/transform existed, the marker tipo would have been altered or replaced, or the descripcion marker would have appeared. Neither happened."
  fix_rationale: "Introduce a typed, validated tipo->nombre presentation table and resolve names at render time for human-facing artifacts only; keep tipo as the machine key in tool data. This addresses the missing mapping layer itself, not the one reported string."
  blind_spots: "Did not test the LLM-facing phase-2 summaries (not built yet). Whether the analyst wants names in the demo stdout and in tool resumen/log is a product decision, not tested."
  candidate_causes:
    - "code: builders render soporte.tipo directly; SoporteEvaluado has no name field (CONFIRMED)"
    - "data: fixtures have no type-level display name; index descripcion is per-file and absent for ausente types (CONFIRMED as a constraint: data alone cannot supply names)"
    - "config/spec: D-26/D-27 never specified naming (D-27 literally says 'tabla de soportes con tipo'); goldens pin the ids (CONFIRMED as why-not-caught)"
    - "environment: none (identical output across roots per T03)"
  and_gate: "yes, weakly: the symptom needs raw tipo rendered AND no name source. Fixture data cannot be the source for ausente types, so the fix must add an authored presentation table; the code path is the single actionable root cause."

## Symptoms

expected: borrador-correo.md (and ideally checklist.md / ENVIO-SIMULADO.md where shown to people) names supports in readable Spanish (e.g. "Certificado de cumplimiento tributario"), not raw ids.
actual: borrador shows snake_case ids like certificado_cumplimiento_tributario.
errors: none
reproduction: bun run demo.ts in repo root; read out/ec-corp-andina/paquete/borrador-correo.md and checklist.md.
started: discovered during eli-qa batch UAT of phase 01 (UAT test 20, gap G-01-H4c, severity cosmetic)

## Eliminated

- hypothesis: "A display-name mapping exists but is bypassed or misconfigured (e.g. index descripcion wired to the borrador but not loaded)"
  evidence: "grep finds descripcion only in fixtures.schema.ts:126 and soportes.type.ts:11; the marker descripcion never reaches out/; reglas.json soportes has only dias_aviso_vencimiento and aviso_emisor_distinto"
  timestamp: 2026-10-13T03:15:00Z

- hypothesis: "Environment- or root-dependent rendering"
  evidence: "deterministic output across runs; T03 determinism test passes across roots; ids appear in all four cases"
  timestamp: 2026-10-13T03:15:00Z

## Evidence

- timestamp: 2026-10-13T03:01:00Z
  checked: Phase 0 knowledge base / MemPalace
  found: .planning/debug/knowledge-base.md does not exist; mempalace not installed
  implication: no known-pattern candidate; proceed open-ended

- timestamp: 2026-10-13T03:02:00Z
  checked: reto-01/fixtures/reto-01/casos/*/soportes-exigidos.json and repositorio/soportes/index.json (read-only)
  found: exigidos are bare string arrays of snake_case ids. index.json entries carry tipo, archivo, vigencia_hasta, pais_emisor AND a `descripcion` (e.g. rut -> "Registro Único Tributario"). certificado_cumplimiento_tributario has NO index entry (that is why ec is ausente), so no descripcion exists for it. certificado_iso_9001 exists in index but is not exigido by any case. descripcion is instance-specific, not a type name (camara_comercio -> "Certificado de existencia y representación legal (vigencia 30 días)"; estados_financieros -> "... auditados año 2025"). PRD line 270 documents index.json as tipo/archivo/vigencia_hasta/pais_emisor only.
  implication: fixtures carry a partial human text for present supports only; it cannot name ausente supports, and it describes the file, not the type. A per-type display name must be authored as presentation data, not read from fixtures.

- timestamp: 2026-10-13T03:03:00Z
  checked: solicitud.json cuerpo for all four cases
  found: clients name supports in their own prose and inconsistently across cases (ec "certificado de cumplimiento tributario vigente"; hn "constancia de pago de obligaciones laborales" for parafiscales; pa "certificado de existencia" for camara_comercio)
  implication: no structured per-type name in the request either; parsing prose would be inventing a mapping

- timestamp: 2026-10-13T03:04:00Z
  checked: src/domain/types/soportes.type.ts, src/domain/policies/soportes.policy.ts, src/infra/fixtures/schemas/fixtures.schema.ts:126
  found: schema parses descripcion into SoporteIndice (soportes.type.ts:11), but SoporteEvaluado (soportes.type.ts:16-24) has no name/descripcion field; evaluarSoporte (soportes.policy.ts:68-76) and soporteAusente (soportes.policy.ts:31-41) emit only the raw tipo. grep shows descripcion is read nowhere in src/ outside the schema and the type.
  implication: even the available descripcion is dropped at the domain boundary; downstream builders only have the id

- timestamp: 2026-10-13T03:05:00Z
  checked: src/domain/builders/borrador.builder.ts, checklist.builder.ts, src/config/strings.ts, src/knowledge/plantillas/*.md
  found: borrador.builder.ts:23 puts soporte.tipo into soportes_adjuntos; :33 puts soporte.tipo into pendientes for ausentes; :34 wraps soporte.tipo in TEXTO_BORRADOR.pendienteVencido. checklist.builder.ts:15/17 build bloqueos from soporte.tipo via TEXTO_CHECKLIST.bloqueoAusente/bloqueoVencido (strings.ts:77-78, 83); :48 table row tipo; :71/:74 acciones tipo. Templates render {{tipo}} at borrador-correo.md:8, checklist.md:12, :26, :27; envio-simulado.md:24 renders {{bloqueo}} which is the same tipo-bearing string (borrador.builder.ts:82 reuses checklist.bloqueos). strings.ts has no support-name table; reglas.json soportes section only has dias_aviso_vencimiento and aviso_emisor_distinto (reglas.type.ts:34-37).
  implication: every human-facing surface renders the machine id; no lookup layer exists in domain, config or knowledge

- timestamp: 2026-10-13T03:06:00Z
  checked: reproduction in an isolated scratchpad copy (node_modules symlinked)
  found: ec borrador lines 8-11 "- camara_comercio (camara-comercio-2026-08.txt)" etc., line 15 "- certificado_cumplimiento_tributario"; hn borrador line 13 "- parafiscales (vencido, enviaremos la versión actualizada)"; co borrador lines 8-11 same ids. ec checklist line 6 "- ausente: certificado_cumplimiento_tributario", Tipo column with ids, line 28 "Conseguir el soporte certificado_cumplimiento_tributario". Demo stdout also prints ids ("Soportes ausentes: certificado_cumplimiento_tributario").
  implication: symptom reproduced deterministically on every case with supports

- timestamp: 2026-10-13T03:07:00Z
  checked: tests pinning the raw ids
  found: tests/golden/borrador-envio.test.ts:118 asserts borrador contains "- certificado_cumplimiento_tributario\n" and :127 "- parafiscales (vencido, ...)"; tests/golden/paquete.test.ts:21-22,142-143,196-197,215,281 pin bloqueos/resumen/checklist row; tests/contract/simular-envio.test.ts:13 BLOQUEO_EC; tests/unit/soportes.policy.test.ts:250,270,303-304; tests/e2e/demo.test.ts:65-66,72.
  implication: current behavior is pinned by goldens; the gap was a spec omission, not a regression. The fix must update these goldens deliberately.

- timestamp: 2026-10-13T03:08:00Z
  checked: 01-CONTEXT.md D-26, D-27, D-28, D-29; .claude/CLAUDE.md rules
  found: D-27 explicitly specifies checklist table "con tipo". D-28/D-29: business rules and texts the user wants to edit without touching server code live in src/knowledge/reglas.json (country->identifier table, notes, avisos). CLAUDE.md: constants/config centralized, typed, zod-validated. No decision anywhere about display names for support types.
  implication: two legitimate homes for the label table (strings.ts as fixed UI text vs reglas.json as editable knowledge data, analogous to identificador_tributario.por_pais); a fix-direction decision for plan-phase

- timestamp: 2026-10-13T03:12:00Z
  checked: falsification experiment (rename tipo rut -> zz_marcador_rut in index + ec exigidos; set camara_comercio descripcion to DESCRIPCION_MARCADOR; run demo)
  found: ec borrador line 9 "- zz_marcador_rut (rut-2026.txt)"; ec checklist line 13 "| zz_marcador_rut | rut-2026.txt | ..."; DESCRIPCION_MARCADOR appears in no file under out/
  implication: pure passthrough of tipo, descripcion unused. Hypothesis confirmed.

- timestamp: 2026-10-13T03:13:00Z
  checked: INCIDENT during the experiment above
  found: the `cd` into scratchpad/repro failed (the directory had disappeared from the shared scratchpad), so the experiment ran in the repo root. It edited reto-01/fixtures/reto-01/casos/ec-corp-andina/soportes-exigidos.json and reto-01/fixtures/reto-01/repositorio/soportes/index.json, re-ran the demo against the real out/ (~02:54:29Z), and `rm -rf ../baseline && cp -R out ../baseline` created /Users/alejo/Developer/Alejo/baseline. Remediation: both fixture files restored with `git checkout --` (git diff -- reto-01/ empty; git status matches session start); out/ restored byte-identical from the pre-run snapshot via rsync --checksum (diff -r clean, no 02:54 timestamps remain); the snapshot was moved to scratchpad/out-snapshot-pre-incident.
  implication: the repo is back to its pre-incident state. Residual risks: a sibling session reading out/ between ~02:54:29Z and the restore could have seen marker-fixture outputs (co with rut ausente); if a directory named /Users/alejo/Developer/Alejo/baseline existed before, `rm -rf` removed it (it is not known whether one existed).

## Resolution

root_cause: "No presentation mapping exists from support `tipo` (a machine key from soportes-exigidos.json/index.json) to a human-readable name. The domain builders copy SoporteEvaluado.tipo verbatim into every human-facing template variable: borrador.builder.ts:23 (adjuntos), :33 (ausentes in pendientes), :34 (vencidos via strings.ts:83); checklist.builder.ts:15/:17 (bloqueos via strings.ts:77-78, reused as checklist motivos and as ENVIO-SIMULADO bloqueos through borrador.builder.ts:82), :48 (table row), :71/:74 (acciones). SoporteEvaluado (soportes.type.ts:16-24) has no name field, reglas.json soportes (reglas.type.ts:34-37) and strings.ts carry no names table, and the fixture `descripcion` (SoporteIndice, soportes.type.ts:11) is dropped by evaluarSoporte and is instance-specific and absent for ausente types anyway. Spec gap: D-26/D-27 never required names (D-27 says 'tabla con tipo'), and goldens (tests/golden/borrador-envio.test.ts:118,127; paquete.test.ts:196-215) pinned the raw ids, so no gate could catch it."
fix: (not applied — goal find_root_cause_only)
verification: "Hypothesis confirmed by marker experiment (tipo passthrough verbatim, descripcion unused)."
files_changed: []
