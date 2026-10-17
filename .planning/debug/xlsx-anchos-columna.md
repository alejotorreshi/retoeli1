---
status: diagnosed
trigger: "xlsx columns are wide enough to read every label and value (gap G-01-H1, severity cosmetic, UAT test 17)"
created: 2026-10-12T00:00:00Z
updated: 2026-10-12T00:09:00Z
goal: find_root_cause_only
symptoms_prefilled: true
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (deterministic, reproduces on every run)
hypothesis: CONFIRMED. writeXlsx never sets column widths, so every used column keeps the default width (~8.43 chars)
test: done (demo.ts + exceljs readback + XML inspection + with/without-width spike)
expecting: n/a
next_action: return ROOT CAUSE FOUND to the orchestrator (goal find_root_cause_only); plan-phase --gaps applies the fix

reasoning_checkpoint:
  hypothesis: "Labels and values are truncated because xlsx-writer.adapter.ts writes no column widths, so exceljs emits no <cols> and viewers use the 8.43-char default for columns holding 20-82 chars of text"
  confirming_evidence:
    - "exceljs readback of the demo outputs: width undefined for A/B/C on all three sheets, defaultColWidth undefined"
    - "sheet XML has no <cols> element; spike shows that adding getColumn().width is what emits <cols>"
    - "the source has no width/columns call (grep over src/tests only matches the PDF code)"
  falsification_test: "if widths were set somewhere, the readback would show numeric widths or the XML would contain <cols>. It shows neither."
  fix_rationale: "derive widths per sheet from the columns the template actually uses and from the text written there. This addresses the missing layout step directly, not the viewer."
  blind_spots: "no check that row height auto-fits on open in Excel or LibreOffice when wrapText is used on capped columns; Excel's bold glyph width vs the character-unit width estimate is not measured"
  candidate_causes:
    - "code: writer omits column widths (confirmed)"
    - "data/config: template contract has no width field and the PRD defines none (contributing only: nothing to drop, so the code must compute widths)"
    - "environment: viewer rendering (eliminated: the default width applies in every viewer)"
  and_gate: "no. The missing width step alone produces the symptom. The absence of a width spec explains why it was never built and never tested, but it is not a second runtime condition."

## Symptoms

expected: opening out/<caso>/formulario.xlsx (co-industrias-delta, hn-agroexport-sula) shows full labels and values without truncation; bold labels and estado fills unchanged.
actual: labels and values cut off in co/hn xlsx (no column widths) — e.g. "Razón socia…", "Correo elec…", "Periferia IT Gr…". Screenshot (local, gitignored): .qa/evidence/01-n-cleo-determinista/screenshots/01-test17-xlsx-hn-agroexport-sula.png
errors: none (cosmetic rendering issue)
reproduction: `bun run demo.ts` in repo root; read column widths of each worksheet with exceljs (ws.columns[i].width).
started: discovered during eli-qa batch UAT of phase 01 (always broken since 01-07 introduced the xlsx writer)

## Eliminated

- hypothesis: viewer-specific rendering (Quick Look/LibreOffice) causes the clipping, Excel would show it fine
  evidence: the files carry no <cols> and no defaultColWidth, so every viewer including Excel falls back to the 8.43-char default. Labels are clipped in any viewer because the cell to their right (the value) is non-empty. The viewer only changes whether long values visibly overflow into the empty column to their right.
  timestamp: 2026-10-12T00:07:30Z

- hypothesis: template data (plantilla-celdas.json) or the fixtures are supposed to carry widths and they are being dropped
  evidence: the template schema and both fixtures have only {hoja, celda_etiqueta, etiqueta, celda_valor}, and PRD L261 defines exactly that shape. There is nothing to drop.
  timestamp: 2026-10-12T00:08:30Z

- hypothesis: cell formatting (numFmt "@" text format, bold font, fills, notes) suppresses overflow or truncates text
  evidence: the spike shows that only width/<cols> changes the layout. Bold and fills render correctly in the screenshots. Text format does not cause truncation; the non-empty neighbor cell and the default width do.
  timestamp: 2026-10-12T00:08:45Z

## Evidence

- timestamp: 2026-10-12T00:01:00Z
  checked: .planning/debug/knowledge-base.md
  found: file does not exist; no prior resolved session to match (MemPalace not used)
  implication: no known-pattern candidate; proceed with open investigation

- timestamp: 2026-10-12T00:02:00Z
  checked: src/infra/output/xlsx-writer.adapter.ts (full file, 51 lines) and src/config/constants/xlsx.constants.ts
  found: writeXlsx (L41-51) creates sheets via libro.addWorksheet(nombre) (L16) with no options; escribirFila (L34-39) only sets value, font bold and the value cell's numFmt/fill/note. No call to worksheet.getColumn(..).width, worksheet.columns, or properties.defaultColWidth anywhere. xlsx.constants.ts has no width constant.
  implication: every column is emitted with no <cols> element, so Excel/LibreOffice/Quick Look use the default width (~8.43 chars, 64 px)

- timestamp: 2026-10-12T00:03:00Z
  checked: grep -rniE "width|.columns|getColumn|ancho" over src/ tests/ demo.ts
  found: only hits are in the PDF renderer/layout (pdf-renderer.adapter.ts, pdf-layout.util.ts, pdf.constants.ts). Nothing in xlsx code or tests.
  implication: column width was never designed for xlsx; no test asserts it (tests/golden/formulario-xlsx.test.ts checks cell content/fonts/fills/notes only)

- timestamp: 2026-10-12T00:04:00Z
  checked: plantilla-celdas.json for co-industrias-delta and hn-agroexport-sula (addresses and label lengths only)
  found: co uses labels in column B, values in column C (two sheets, 17 rows; label length up to 30 chars). hn uses labels in A, values in B (one sheet, 11 rows; label length up to 23 chars). Column letters are template-defined, not fixed.
  implication: a fixed "set B and C" fix would be wrong for hn and for any client template; widths must be derived per sheet from the columns actually used by the template rows

- timestamp: 2026-10-12T00:05:00Z
  checked: UAT screenshots .qa/evidence/01-n-cleo-determinista/screenshots/01-test17-xlsx-{co-industrias-delta,hn-agroexport-sula}.png
  found: all columns render at equal default width. Labels are clipped at the boundary of the (non-empty) value cell to their right; values overflow to the right and are clipped at the viewer's used-range edge. Bold labels and estado fills (amber, pink) render correctly.
  implication: symptom is purely column width; fonts, fills and notes are not involved

- timestamp: 2026-10-12T00:06:00Z
  checked: ran `bun run demo.ts` (exit 0), then read out/{co-industrias-delta,hn-agroexport-sula}/formulario.xlsx with exceljs (scratchpad/anchos.ts) and unzipped xl/worksheets/sheet*.xml
  found: co "Datos Proveedor" widths A/B/C = undefined, "Datos Bancarios" A/B/C = undefined, hn "Registro" A/B = undefined; properties.defaultColWidth undefined in all three sheets. Raw XML has only <sheetFormatPr defaultRowHeight="15" .../> and NO <cols> element. Max written text length per column: co Datos Proveedor B=30 (labels) C=82 (values); co Datos Bancarios B=20 C=25; hn Registro A=23 (labels) B=30 (values).
  implication: reproduced deterministically. Every used column is at default width (~8.43 chars) while content needs 20-82 chars. Bohrbug.

- timestamp: 2026-10-12T00:07:00Z
  checked: spike (scratchpad/spike.ts) building the same synthetic sheet with and without hoja.getColumn(letter).width + wrapText, then comparing with tests/helpers/xlsx-leer.helper.ts leerCeldasXlsx and unzipping the XML
  found: without widths no <cols> is emitted; with widths exceljs emits <cols><col min="1" max="1" width="36" customWidth="1"/>...</cols> and readback returns [36, 60]. leerCeldasXlsx output is identical for both files (it reads value, type, font, fill and note, not width or alignment).
  implication: falsification test passed: the missing width call is exactly what controls the symptom. Adding widths/wrapText cannot break tests/e2e/determinismo.test.ts or the golden xlsx tests, which compare cells semantically.

- timestamp: 2026-10-12T00:08:00Z
  checked: reto-01/PRD.md L109 and L261, plantilla-celdas.json keys, 01-CONTEXT.md D-01..D-04, 01-RESEARCH.md, 01-07-PLAN.md
  found: template contract is exactly {hoja, celda_etiqueta, etiqueta, celda_valor}; no width field. PRD only requires writing label/value at the given cells. No decision or plan mentions xlsx column width or wrapping. 01-RESEARCH.md L615 explicitly requires the 85-char actividad_economica to wrap in the PDF, but no equivalent requirement exists for xlsx.
  implication: requirement gap at plan level (01-07): readability of the xlsx was never specified, so no test gate existed. Widths can only be derived from what is written (labels from the template, values from the maestro), per sheet and per used column.

## Resolution

root_cause: src/infra/output/xlsx-writer.adapter.ts never sets a column width. writeXlsx (L41-51) adds each sheet with addWorksheet(nombre) and no options (L16), and escribirFila (L34-39) and marcarValor (L21-32) only set value, bold font, numFmt, fill and note. There is no getColumn(..).width, columns or defaultColWidth call and no width constant in src/config/constants/xlsx.constants.ts. exceljs therefore writes no <cols> element and every viewer uses the default width of about 8.43 characters. The written content needs 20 to 30 characters for labels and 25 to 82 for values. Labels are clipped by the non-empty value cell to their right, and long values overflow or are clipped. Contributing process gap: neither the PRD, nor plantilla-celdas.json, nor 01-CONTEXT or 01-07-PLAN specifies xlsx readability (the PDF got an explicit wrap requirement, the xlsx did not), so no test asserts widths.
fix: (diagnose-only; not applied)
verification: (diagnose-only) reproduced via demo.ts + exceljs readback (all widths undefined, no <cols>); spike shows setting widths emits <cols> and leaves leerCeldasXlsx output identical
files_changed: []
