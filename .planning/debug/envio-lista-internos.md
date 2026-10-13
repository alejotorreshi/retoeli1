---
status: diagnosed
trigger: "G-01-H4a: ENVIO-SIMULADO lists checklist.md and borrador-correo.md as sent to the client (UAT test 20)"
created: 2026-10-13T02:51:45Z
updated: 2026-10-13T03:05:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

bug_class: Bohrbug (deterministic; reproduces in every confirmed case, every run)
hypothesis: CONFIRMED. The "Archivos que se envían" list is the raw directory listing of paquete/ minus expired soportes; nothing removes the internal paquete files (checklist.md, borrador-correo.md), and since WR-06 (fa85303) the heading claims that list is what is sent.
test: done (scratch repro + git history)
expecting: n/a
next_action: return ROOT CAUSE FOUND to orchestrator; fix is out of scope (plan-phase --gaps)

reasoning_checkpoint:
  hypothesis: "ENVIO-SIMULADO.md lists checklist.md and borrador-correo.md as sent because simular-envio feeds the unfiltered listarPaquete() output into construirDatosEnvio, which partitions only by vencido, and the WR-06 template rename turned that full listing into a 'sent' claim"
  confirming_evidence:
    - "Fresh scratch run (demo + simular_envio confirmado true) shows both internal files under '## Archivos que se envían' for ec, hn and co"
    - "borrador.builder.ts:80 archivos = archivos.filter(not vencido): no other filter; output-files.adapter.ts:69-77 returns every file in paquete/"
    - "git: 9dec848 heading was '## Archivos del paquete' (full listing accurate); fa85303 renamed it to '## Archivos que se envían' without changing the source"
  falsification_test: "If the internal files were excluded somewhere downstream (template, renderer) they would not appear in a fresh run; they do appear in all three cases, so the hypothesis holds"
  fix_rationale: "Deriving the sent list from the domain's notion of what goes to the client (formulario + presente soportes, already computed by adjuntos() for the borrador) instead of from the directory listing addresses the cause, not the symptom"
  blind_spots: "Whether the product wants borrador-correo.md mentioned as the email body (not an attachment) in ENVIO-SIMULADO; that is a wording decision, not part of the root cause"
  candidate_causes:
    - "code: construirDatosEnvio only partitions vencido vs rest (confirmed)"
    - "knowledge/data: envio-simulado.md heading renamed in WR-06 to assert 'se envían' over an unchanged list (confirmed contributor)"
    - "config: ARCHIVOS_PAQUETE carries no internal/client role; NOMBRES_RESERVADOS_PAQUETE mixes internal names with formulario names (enabling condition, not a cause)"
    - "environment: stale out/ from QA run (eliminated by fresh scratch run)"
  and_gate: "yes. The symptom needs both (a) the sent list sourced from the raw paquete/ listing that includes internal files and (b) the template heading claiming that list is what is sent. Before fa85303, (a) existed but the heading 'Archivos del paquete' made it accurate."

## Symptoms

expected: the "Archivos del paquete"/sent list in ENVIO-SIMULADO.md contains only what goes to the client (formulario + non-expired soportes); checklist.md (analyst-only) and borrador-correo.md (the email body) are not presented as sent attachments. Expired soportes stay listed separately under "Soportes vencidos que no se envían" (WR-06 accepted).
actual: ENVIO-SIMULADO lists checklist.md and borrador-correo.md as sent to the client.
errors: none (content/semantics defect)
reproduction: scratch copy of repo, run demo, call proveedor simular_envio confirmado true for ec-corp-andina, read out/ec-corp-andina/ENVIO-SIMULADO.md
started: discovered in eli-qa batch UAT of phase 01 (test 20, gap G-01-H4a)

## Eliminated

- hypothesis: stale ENVIO-SIMULADO.md in repo out/ from the QA run (environment)
  evidence: a fresh scratch copy (no out/, no .qa/) running demo.ts + simular_envio confirmado true reproduces the same list for ec, hn and co
  timestamp: 2026-10-13T02:58:00Z

- hypothesis: fixture-specific data (some case writes extra files into paquete/)
  evidence: all three confirmed cases (ec, hn, co) show exactly checklist.md + borrador-correo.md as the extra entries; both are the constant ARCHIVOS_PAQUETE names written by armar_paquete, independent of fixtures
  timestamp: 2026-10-13T02:58:00Z

- hypothesis: template/renderer drops or mislabels rows (the data is right, the rendering wrong)
  evidence: the template iterates {{#archivos}} verbatim (envio-simulado.md:12); the archivos array already holds the internal names when built at borrador.builder.ts:80
  timestamp: 2026-10-13T03:00:00Z

## Evidence

- timestamp: 2026-10-13T02:53:00Z
  checked: src/application/use-cases/simular-envio.use-case.ts:29-30
  found: archivos = await entorno.salida.listarPaquete(caso) is passed unfiltered to construirDatosEnvio
  implication: the sent list is derived from the raw directory listing of paquete/

- timestamp: 2026-10-13T02:53:00Z
  checked: src/infra/output/output-files.adapter.ts:69-77 (listPackage)
  found: returns every regular file name in out/<caso>/paquete/, sorted; no role filtering
  implication: checklist.md and borrador-correo.md (written into paquete/ by armar_paquete, ARCHIVOS_PAQUETE in files.constants.ts:38-41) are included

- timestamp: 2026-10-13T02:53:00Z
  checked: src/domain/builders/borrador.builder.ts:59-84 (archivosVencidos, construirDatosEnvio)
  found: archivos = archivos.filter(not vencido); retenidos = archivos.filter(vencido). The only partition is vencido vs everything-else; ARCHIVOS_PAQUETE internal files fall into archivos
  implication: internal files land under "## Archivos que se envían" in envio-simulado.md:10-14

- timestamp: 2026-10-13T02:55:00Z
  checked: repo out/ec-corp-andina/ENVIO-SIMULADO.md (QA run)
  found: "Archivos que se envían" lists borrador-correo.md, checklist.md, formulario.pdf and the presente soportes
  implication: matches the user report

- timestamp: 2026-10-13T02:58:00Z
  checked: fresh scratch copy, bun run demo.ts (exit 0, truth table intact) then simular_envio confirmado true for ec, hn, co with FECHA_EJECUCION=2026-09-03
  found: in all three, enviados contains paquete/checklist.md and paquete/borrador-correo.md; hn retenidos correctly holds only the vencido parafiscales file
  implication: deterministic Bohrbug; WR-06 partition works, internal-file exclusion is missing

- timestamp: 2026-10-13T03:00:00Z
  checked: src/domain/builders/borrador.builder.ts:20-26,38-57 (adjuntos, construirDatosBorrador)
  found: the borrador already defines the client-facing set as formulario (nombreFormulario) + soportes with estado presente and archivo !== null
  implication: two sources of truth for "what goes to the client": borrador uses domain state, ENVIO-SIMULADO uses the filesystem listing

- timestamp: 2026-10-13T03:02:00Z
  checked: git history of src/knowledge/plantillas/envio-simulado.md
  found: 9dec848 (01-10) introduced "## Archivos del paquete" (01-10-SUMMARY: "lists the actual paquete/ files via salida.listarPaquete"); fa85303 (WR-06 fix) renamed it to "## Archivos que se envían", added the retenidos section, and changed the builder only to subtract vencidos
  implication: the defect was introduced by fa85303, which changed the list's meaning (package contents to sent set) without changing its source

- timestamp: 2026-10-13T03:03:00Z
  checked: tests/golden/borrador-envio.test.ts:143-155 (WR-06 golden) and other tests referencing ENVIO-SIMULADO
  found: asserts enviados contains formulario.xlsx and not the vencido file; no test asserts checklist.md / borrador-correo.md are absent from enviados
  implication: why not caught: no gate checks the internal-file exclusion

- timestamp: 2026-10-13T03:04:00Z
  checked: src/config/constants/files.constants.ts:38-41,56-59
  found: ARCHIVOS_PAQUETE = {CHECKLIST, BORRADOR_CORREO} has no client/internal role; NOMBRES_RESERVADOS_PAQUETE unions ARCHIVOS_PAQUETE with formulario names, so it is not usable as an "internal" filter as-is
  implication: fix needs either an explicit internal set or a domain-derived sent set

## Resolution

root_cause: "simular-envio.use-case.ts:29-30 passes the unfiltered paquete/ directory listing (output-files.adapter.ts:69-77) to construirDatosEnvio, which at borrador.builder.ts:80 only subtracts vencido soportes, so the internal files armar_paquete writes into paquete/ (ARCHIVOS_PAQUETE: checklist.md, borrador-correo.md, files.constants.ts:38-41) stay in `archivos`; AND the WR-06 fix (fa85303) renamed the template heading at envio-simulado.md:10 from 'Archivos del paquete' to 'Archivos que se envían', turning that full listing into a claim about what is sent to the client"
fix: (not in scope: find_root_cause_only)
verification: (not in scope)
files_changed: []
