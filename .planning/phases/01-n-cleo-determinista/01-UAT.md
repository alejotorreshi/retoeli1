---
status: diagnosed
phase: 01-n-cleo-determinista
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md, 01-07-SUMMARY.md, 01-08-SUMMARY.md, 01-09-SUMMARY.md, 01-10-SUMMARY.md, 01-11-SUMMARY.md]
started: 2026-10-13T02:11:03Z
updated: 2026-10-13T02:57:43Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold start: quality gates green from scratch
expected: check exits 0 (tsc strict, Biome, bun audit clean); bun test exits 0 with 0 fail; no skipped or todo tests
result: pass
suite_id: T01

### 2. Demo without LLM key: four cases end to end
expected: exit 0, prints the effective execution date line; Resumen table: co xlsx 17/0/0 LISTO, ec pdf 13/1/1 BLOQUEADO, hn xlsx 9/1/1 BLOQUEADO, pa portal 8/0/1 LISTO; simular_envio unconfirmed answers 'requiere confirmación explícita' and nothing is sent; out/<caso>/ holds formulario (xlsx|pdf|valores-portal.md), mapeo.json, paquete/ and log.jsonl for each case
result: pass
suite_id: T02

### 3. Determinism across runs and roots
expected: identical stdout across the three runs; identical file list and content modulo documented volatile fields; no absolute path of either root in any output
result: pass
suite_id: T03

### 4. simular_envio confirmation gate (ENV-01)
expected: false and missing give ok:false, codigo CONFIRMACION_REQUERIDA, error exactly 'requiere confirmación explícita', no file written; string "true" gives ARGS_INVALIDOS; true without paquete gives PAQUETE_NO_ARMADO; true with paquete writes only ENVIO-SIMULADO.md with the current bloqueos, without requiring listo_para_firma
result: pass
suite_id: T04

### 5. Reprocessing after a send cleans stale outputs (D-12)
expected: paquete/ and ENVIO-SIMULADO.md no longer exist; a fresh formulario exists
result: pass
suite_id: T05

### 6. Audit logs on every call (SEG-04, RN5)
expected: one line per call in out/log.jsonl; one line per call with a resolved caso in out/<caso>/log.jsonl; fields only ts, herramienta, ok, resumen (+ sesion, caso, codigo); the marker value never appears
result: pass
suite_id: T06

### 7. Blank maestro value becomes faltante (CR-01 regression)
expected: mapear_campos counts both as faltante; xlsx cells carry the faltante mark; checklist lists both under Campos faltantes; borrador mentions them as pending
result: pass
suite_id: T07

### 8. Non-text maestro values need confirmation (WR-02)
expected: the boolean field is requiere_confirmacion with a note and no value; no 'Sí/No' or joined text is written to the form
result: pass
suite_id: T08

### 9. RN1 enforced in code, not by data (WR-03)
expected: ec RUC stays requiere_confirmacion; the generic tax-id label stays requiere_confirmacion
result: pass
suite_id: T09

### 10. Generic label consistency between tools (WR-04)
expected: leer_solicitud lists it in ambiguos with the country proposal; mapear_campos marks it requiere_confirmacion with the same proposal, not faltante
result: pass
suite_id: T10

### 11. Newest support entry wins (WR-05)
expected: the renewed entry is evaluated (presente); the package is not blocked by the old copy
result: pass
suite_id: T11

### 12. Expired support is consistent across package, send and email (WR-06)
expected: parafiscales is in paquete/ and marked vencido in the checklist; ENVIO-SIMULADO lists it under 'Soportes vencidos que no se envían'; the borrador says it will be sent later, never as attached
result: pass
suite_id: T12
note: product decision WR-06 accepted — expired supports stay in paquete/ and are excluded from the send

### 13. Both templates present: the format decides (IN-07)
expected: xlsx uses plantilla-celdas.json; pdf and portal use plantilla-campos.json; no PLANTILLA_INVALIDA
result: pass
suite_id: T13

### 14. Checklist shows the issuing country (WR-17)
expected: 'País emisor' column holds a country code for every support; warnings live in the 'Aviso de emisor' column; armar_paquete returns pais_emisor per support
result: pass
suite_id: T14

### 15. No PII outside the forms (broad scan)
expected: zero hits outside formulario and valores-portal.md; positive control: values found in formulario.xlsx and valores-portal.md
result: pass
suite_id: T15
note: accepted exception — borrador signature uses allowlisted contacto_financiero.nombre/cargo + razon_social (RN2 and PRD 8 respected); decided by the user

### 16. Model-facing tool contract (CA2, WR-18)
expected: exactly the five PRD exports; one-sentence descriptions; every tool reference in model-facing text uses the proveedor_ prefix; schemas have additionalProperties false and the locked field names
result: pass
suite_id: T16
note: resumen keeps the short tool name per locked contract v1 (01-02); herramienta carries proveedor_ name; decided by the user

### 17. xlsx look in Excel/LibreOffice (co, hn)
expected: Bold labels, fill colors for faltante / por confirmar, notes readable
result: issue
reported: "Labels and values are cut off in the xlsx (no column widths): Razón socia…, Correo elec…, Periferia IT Gr…"
severity: cosmetic
suite_id: H1

### 18. PDF layout quality (ec)
expected: Two columns, marks [FALTANTE] in red and [POR CONFIRMAR] in amber, Notas section, wrapping
result: pass
suite_id: H2

### 19. Checklist readability for the analyst
expected: Wording of actions, table layout incl. País emisor / Aviso de emisor
result: pass
suite_id: H3

### 20. Tone of borrador-correo and ENVIO-SIMULADO
expected: Professional Spanish tone for the client and the analyst; no bank data
result: issue
reported: "ENVIO-SIMULADO lists checklist.md and borrador-correo.md as sent to the client; the borrador says the form is firmado por el representante legal while the case is BLOQUEADO / has fields to confirm; the borrador shows snake_case support ids"
severity: major
suite_id: H4

### 21. Product decisions from the fixes (WR-02, WR-03, IN-07)
expected: Non-text maestro values → requiere_confirmacion; RN1 code-enforced; Format chooses the template when both exist
result: pass
suite_id: H5
note: decisions WR-02, WR-03, IN-07 accepted by the user

### 22. Supply-chain and Bun gate (recorded checkpoint 01-01)
expected: resume signal recorded verbatim; bun --version 1.4.3
result: pass
suite_id: R1

### 23. Tool contract v1 lock (recorded checkpoint 01-02)
expected: option-a recorded with the human resume signal
result: pass
suite_id: R2

### 24. reto-01/ tracked unchanged and no .DS_Store tracked
expected: reto-01/ tracked unchanged and no .DS_Store tracked
result: pass
source: automated
coverage_id: 01-01/D2

### 25. Pinned toolchain with bun run check (tsc strict, Biome noExplicitAny, bun audit moderate) green
expected: Pinned toolchain with bun run check (tsc strict, Biome noExplicitAny, bun audit moderate) green
result: pass
source: automated
coverage_id: 01-01/D3

### 26. Architecture guard: layer table, type-only imports, no shell APIs, proven on inline samples
expected: Architecture guard: layer table, type-only imports, no shell APIs, proven on inline samples
result: pass
source: automated
coverage_id: 01-01/D4

### 27. No-comments guard over src/, tests/ and demo.ts, proven on inline samples
expected: No-comments guard over src/, tests/ and demo.ts, proven on inline samples
result: pass
source: automated
coverage_id: 01-01/D5

### 28. proveedor_leer_solicitud returns the contract data for co (xlsx, 17 campos, 4 soportes), ec (pdf) and pa (portal)
expected: proveedor_leer_solicitud returns the contract data for co (xlsx, 17 campos, 4 soportes), ec (pdf) and pa (portal)
result: pass
source: automated
coverage_id: 01-02/D2

### 29. Junk args, extra keys and wrong types give ARGS_INVALIDOS with a value-free Spanish detail capped at MAX_ISSUES_ARGS
expected: Junk args, extra keys and wrong types give ARGS_INVALIDOS with a value-free Spanish detail capped at MAX_ISSUES_ARGS
result: pass
source: automated
coverage_id: 01-02/D3

### 30. Execute never throws: internal throws become ERROR_INTERNO with no stack, and only error.name reaches stderr
expected: Execute never throws: internal throws become ERROR_INTERNO with no stack, and only error.name reaches stderr
result: pass
source: automated
coverage_id: 01-02/D4

### 31. Traversal-shaped casos give CASO_INVALIDO before IO, and unknown casos give CASO_NO_ENCONTRADO; paths are built from ctx.directory
expected: Traversal-shaped casos give CASO_INVALIDO before IO, and unknown casos give CASO_NO_ENCONTRADO; paths are built from ctx.directory
result: pass
source: automated
coverage_id: 01-02/D5

### 32. Import with an empty environment works; ctx is validated (CONFIGURACION_INVALIDA) and sessionId|sessionID is normalized
expected: Import with an empty environment works; ctx is validated (CONFIGURACION_INVALIDA) and sessionId|sessionID is normalized
result: pass
source: automated
coverage_id: 01-02/D6

### 33. Invalid or oversized fixtures give DATOS_INVALIDOS, and a template mismatch gives PLANTILLA_INVALIDA with parcial
expected: Invalid or oversized fixtures give DATOS_INVALIDOS, and a template mismatch gives PLANTILLA_INVALIDA with parcial
result: pass
source: automated
coverage_id: 01-02/D7

### 34. Constants centralized in src/config/constantes.ts; layers respected (only wiring.ts imports infra); no comments
expected: Constants centralized in src/config/constantes.ts; layers respected (only wiring.ts imports infra); no comments
result: pass
source: automated
coverage_id: 01-02/D8

### 35. Realpath-contained case resolution: ../x, a/b, CO and a runtime symlink escaping casos/ give CASO_INVALIDO
expected: Realpath-contained case resolution: ../x, a/b, CO and a runtime symlink escaping casos/ give CASO_INVALIDO
result: pass
source: automated
coverage_id: 01-03/D1

### 36. caso \"\" and an unknown caso give CASO_NO_ENCONTRADO with the sorted casos_disponibles; no out/<caso> is created
expected: caso \"\" and an unknown caso give CASO_NO_ENCONTRADO with the sorted casos_disponibles; no out/<caso> is created
result: pass
source: automated
coverage_id: 01-03/D2

### 37. A copy of co with a corrupt plantilla-celdas.json gives PLANTILLA_INVALIDA with parcial pais CO, formato xlsx and 4 soportes (D-17)
expected: A copy of co with a corrupt plantilla-celdas.json gives PLANTILLA_INVALIDA with parcial pais CO, formato xlsx and 4 soportes (D-17)
result: pass
source: automated
coverage_id: 01-03/D3

### 38. Both jsonl logs on every execution, sessionID logged as sesion, no raw arg values in any log
expected: Both jsonl logs on every execution, sessionID logged as sesion, no raw arg values in any log
result: pass
source: automated
coverage_id: 01-03/D4

### 39. Per-execution env: FECHA_EJECUCION \"\" is unset, impossible dates and unknown zones give CONFIGURACION_INVALIDA, and that failure is logged
expected: Per-execution env: FECHA_EJECUCION \"\" is unset, impossible dates and unknown zones give CONFIGURACION_INVALIDA, and that failure is logged
result: pass
source: automated
coverage_id: 01-03/D5

### 40. Injectable clock: relojFijo returns the fixed date, relojSistema returns YYYY-MM-DD in America/Bogota
expected: Injectable clock: relojFijo returns the fixed date, relojSistema returns YYYY-MM-DD in America/Bogota
result: pass
source: automated
coverage_id: 01-03/D6

### 41. bun run demo.ts runs without any LLM key, cleans out/, prints the effective date 2026-09-03 and one line per real case, never maestro values
expected: bun run demo.ts runs without any LLM key, cleans out/, prints the effective date 2026-09-03 and one line per real case, never maestro values
result: pass
source: automated
coverage_id: 01-03/D7

### 42. proveedor.ts exports only PRD tool names with one-sentence descriptions; the src/demo layer rule applies to real files
expected: proveedor.ts exports only PRD tool names with one-sentence descriptions; the src/demo layer rule applies to real files
result: pass
source: automated
coverage_id: 01-03/D8

### 43. reglas.json carries the D-19 scale, umbral 0.8, D-29 country table, generic labels, context notes, 30-day warning and template paths, without PII policy
expected: reglas.json carries the D-19 scale, umbral 0.8, D-29 country table, generic labels, context notes, 30-day warning and template paths, without PII policy
result: pass
source: automated
coverage_id: 01-04/D1

### 44. Label normalization (NFD/NFC equivalent) and String-only number conversion
expected: Label normalization (NFD/NFC equivalent) and String-only number conversion
result: pass
source: automated
coverage_id: 01-04/D2

### 45. Strict template engine: unknown variable or section gives REGLAS_INVALIDAS naming the template, pipes escaped, newlines flattened, no re-interpretation of values
expected: Strict template engine: unknown variable or section gives REGLAS_INVALIDAS naming the template, pipes escaped, newlines flattened, no re-interpretation of values
result: pass
source: automated
coverage_id: 01-04/D3

### 46. Mapping engine reproduces the four-case truth table 17/0/0, 13/1/1, 9/1/1, 8/0/1 with RN1, faltantes and context notes
expected: Mapping engine reproduces the four-case truth table 17/0/0, 13/1/1, 9/1/1, 8/0/1 with RN1, faltantes and context notes
result: pass
source: automated
coverage_id: 01-04/D4

### 47. Synthetic rules: generic labels (CO and EC), normalized glossary, direct key, threshold boundary, prototype keys, note variable allowlist
expected: Synthetic rules: generic labels (CO and EC), normalized glossary, direct key, threshold boundary, prototype keys, note variable allowlist
result: pass
source: automated
coverage_id: 01-04/D5

### 48. Nested ruta reads with own-property walk; missing, non-scalar and prototype segments give faltante
expected: Nested ruta reads with own-property walk; missing, non-scalar and prototype segments give faltante
result: pass
source: automated
coverage_id: 01-04/D6

### 49. Code-owned PII policy: D-05 public list, D-07 masks, default [dato oculto], presentarCampo without valor; no non-public raw value in the four real cases
expected: Code-owned PII policy: D-05 public list, D-07 masks, default [dato oculto], presentarCampo without valor; no non-public raw value in the four real cases
result: pass
source: automated
coverage_id: 01-04/D7

### 50. Context notes (hn Ingresos 'COP, año 2025', País note) rendered only from reglas text plus allowlisted variables
expected: Context notes (hn Ingresos 'COP, año 2025', País note) rendered only from reglas text plus allowlisted variables
result: pass
source: automated
coverage_id: 01-04/D8

### 51. proveedor_mapear_campos returns 17/0/0, 13/1/1, 9/1/1 and 8/0/1 for the four real cases through the exported tool
expected: proveedor_mapear_campos returns 17/0/0, 13/1/1, 9/1/1 and 8/0/1 for the four real cases through the exported tool
result: pass
source: automated
coverage_id: 01-05/D1

### 52. ec RUC is regla_pais 0.6 with •••••3456 and the foreign-identifier note; ec and hn faltantes have ruta null
expected: ec RUC is regla_pais 0.6 with •••••3456 and the foreign-identifier note; ec and hn faltantes have ruta null
result: pass
source: automated
coverage_id: 01-05/D2

### 53. Only masked values reach the caller: eight contract keys per item, D-07 masks, no valor key, no raw sensitive strings
expected: Only masked values reach the caller: eight contract keys per item, D-07 masks, no valor key, no raw sensitive strings
result: pass
source: automated
coverage_id: 01-05/D3

### 54. out/<caso>/mapeo.json holds the full canonical mapping {caso, pais, fecha_ejecucion, campos} with ruta, regla and confianza and no raw value
expected: out/<caso>/mapeo.json holds the full canonical mapping {caso, pais, fecha_ejecucion, campos} with ruta, regla and confianza and no raw value
result: pass
source: automated
coverage_id: 01-05/D4

### 55. D-15 subsets: [] means all, normalized matching, CAMPOS_FUERA_DE_PLANTILLA with etiquetas_esperadas and no echo
expected: D-15 subsets: [] means all, normalized matching, CAMPOS_FUERA_DE_PLANTILLA with etiquetas_esperadas and no echo
result: pass
source: automated
coverage_id: 01-05/D5

### 56. reglas.json loaded per execution with a strict zod schema; broken rules give REGLAS_INVALIDAS with the key path; the knowledge folder is redirectable by code
expected: reglas.json loaded per execution with a strict zod schema; broken rules give REGLAS_INVALIDAS with the key path; the knowledge folder is redirectable by code
result: pass
source: automated
coverage_id: 01-05/D6

### 57. Allowlisted writer with realpath containment and the per-caso lock
expected: Allowlisted writer with realpath containment and the per-caso lock
result: pass
source: automated
coverage_id: 01-05/D7

### 58. Context note on hn Ingresos ('COP, año 2025') through the tool
expected: Context note on hn Ingresos ('COP, año 2025') through the tool
result: pass
source: automated
coverage_id: 01-05/D8

### 59. leer_solicitud unchanged after moving onto cargarSolicitudCaso
expected: leer_solicitud unchanged after moving onto cargarSolicitudCaso
result: pass
source: automated
coverage_id: 01-05/D9

### 60. leer_solicitud reports ambiguos with NIT for zz-generica-co and RUC for zz-generica-ec; the four real cases give []
expected: leer_solicitud reports ambiguos with NIT for zz-generica-co and RUC for zz-generica-ec; the four real cases give []
result: pass
source: automated
coverage_id: 01-06/D1

### 61. elegirPlantilla asserted for all six matrix rows, including the three no real case hits
expected: elegirPlantilla asserted for all six matrix rows, including the three no real case hits
result: pass
source: automated
coverage_id: 01-06/D2

### 62. zz-generica-co maps etiqueta_generica 0.5, glosario_normalizado 0.95, clave_directa 0.85 and two faltantes (boolean and prototype key); zz-generica-ec carries the foreign-identifier note
expected: zz-generica-co maps etiqueta_generica 0.5, glosario_normalizado 0.95, clave_directa 0.85 and two faltantes (boolean and prototype key); zz-generica-ec carries the foreign-identifier note
result: pass
source: automated
coverage_id: 01-06/D3

### 63. zz-plantilla-corrupta gives PLANTILLA_INVALIDA with parcial {pais CO, cliente, formato xlsx, soportes} from both tools
expected: zz-plantilla-corrupta gives PLANTILLA_INVALIDA with parcial {pais CO, cliente, formato xlsx, soportes} from both tools
result: pass
source: automated
coverage_id: 01-06/D4

### 64. Two concurrent mapear_campos calls on co both succeed, mapeo.json has 17 campos and the per-caso log has exactly two parseable lines
expected: Two concurrent mapear_campos calls on co both succeed, mapeo.json has 17 campos and the per-caso log has exactly two parseable lines
result: pass
source: automated
coverage_id: 01-06/D5

### 65. reglas.json with umbral 2, truncated JSON or an unknown key gives REGLAS_INVALIDAS in Spanish without a stack; a nota_extranjero edit shows on the next call
expected: reglas.json with umbral 2, truncated JSON or an unknown key gives REGLAS_INVALIDAS in Spanish without a stack; a nota_extranjero edit shows on the next call
result: pass
source: automated
coverage_id: 01-06/D6

### 66. Umbral 0.86 turns zz-generica-co Sitio web into requiere_confirmacion and 0.85 keeps it lleno, through the file
expected: Umbral 0.86 turns zz-generica-co Sitio web into requiere_confirmacion and 0.85 keeps it lleno, through the file
result: pass
source: automated
coverage_id: 01-06/D7

### 67. co formulario.xlsx has sheets Datos Proveedor and Datos Bancarios with all 17 labels (bold) and maestro values as text cells at the exact cells, including [cuenta ••••2345] at Datos Bancarios!C5 and 050021 at Datos Proveedor!C8, created date 2026-09-03T00:00:00Z
expected: co formulario.xlsx has sheets Datos Proveedor and Datos Bancarios with all 17 labels (bold) and maestro values as text cells at the exact cells, including [cuenta ••••2345] at Datos Bancarios!C5 and 050021 at Datos Proveedor!C8, created date 2026-09-03T00:00:00Z
result: pass
source: automated
coverage_id: 01-07/D1

### 68. hn formulario.xlsx marks B12 faltante (empty, FFFFC7CE, D-01 note), B3 requiere_confirmacion with raw [NIT ••••3456] (FFFFEB9C, foreign-identifier note), B11 [ingresos] with note COP, año 2025 and B10 480
expected: hn formulario.xlsx marks B12 faltante (empty, FFFFC7CE, D-01 note), B3 requiere_confirmacion with raw [NIT ••••3456] (FFFFEB9C, foreign-identifier note), B11 [ingresos] with note COP, año 2025 and B10 480
result: pass
source: automated
coverage_id: 01-07/D2

### 69. A formula-like string reaches the xlsx as a plain text cell, never a formula and without an apostrophe
expected: A formula-like string reaches the xlsx as a plain text cell, never a formula and without an apostrophe
result: pass
source: automated
coverage_id: 01-07/D3

### 70. generar_formulario rejects tampered mappings (ruta, prototype ruta, estado upgrade, faltante promoted, missing, duplicate, extra, empty) with MAPEO_INCONSISTENTE and canonical-label diferencias, writes nothing, never echoes the extra item's text; a valor key gives ARGS_INVALIDOS
expected: generar_formulario rejects tampered mappings (ruta, prototype ruta, estado upgrade, faltante promoted, missing, duplicate, extra, empty) with MAPEO_INCONSISTENTE and canonical-label diferencias, writes nothing, never echoes the extra item's text; a valor key gives ARGS_INVALIDOS
result: pass
source: automated
coverage_id: 01-07/D4

### 71. Reprocessing overwrites formulario.xlsx and mapeo.json, deletes paquete/ and ENVIO-SIMULADO.md, and appends exactly one line to the existing per-caso log.jsonl
expected: Reprocessing overwrites formulario.xlsx and mapeo.json, deletes paquete/ and ENVIO-SIMULADO.md, and appends exactly one line to the existing per-caso log.jsonl
result: pass
source: automated
coverage_id: 01-07/D5

### 72. ec-corp-andina formulario.pdf lists the 15 labels in template order with [FALTANTE] in red, '<RUC> [POR CONFIRMAR]' in amber and a final Notas section
expected: ec-corp-andina formulario.pdf lists the 15 labels in template order with [FALTANTE] in red, '<RUC> [POR CONFIRMAR]' in amber and a final Notas section
result: pass
source: automated
coverage_id: 01-08/D1

### 73. PDF renders are byte-identical for the same FECHA_EJECUCION, with Producer registro-proveedor and dates 2026-09-03
expected: PDF renders are byte-identical for the same FECHA_EJECUCION, with Producer registro-proveedor and dates 2026-09-03
result: pass
source: automated
coverage_id: 01-08/D2

### 74. No input text can make pdf-lib throw: sanearWinAnsi normalizes NFC, turns CR/LF/TAB into spaces and replaces anything outside the font set with ?
expected: No input text can make pdf-lib throw: sanearWinAnsi normalizes NFC, turns CR/LF/TAB into spaces and replaces anything outside the font set with ?
result: pass
source: automated
coverage_id: 01-08/D3

### 75. pa-logistica-istmo returns ok:true with {ruta: out/pa-logistica-istmo/valores-portal.md, formato: portal, aviso: formato no soportado} and the file lists the 9 labels with maestro values
expected: pa-logistica-istmo returns ok:true with {ruta: out/pa-logistica-istmo/valores-portal.md, formato: portal, aviso: formato no soportado} and the file lists the 9 labels with maestro values
result: pass
source: automated
coverage_id: 01-08/D4

### 76. valores-portal.md is editable data: a text edit changes the next output, and {{banco.numero_cuenta}} gives REGLAS_INVALIDAS with no file written
expected: valores-portal.md is editable data: a text edit changes the next output, and {{banco.numero_cuenta}} gives REGLAS_INVALIDAS with no file written
result: pass
source: automated
coverage_id: 01-08/D5

### 77. The pdf and portal arms reject a tampered mapping with MAPEO_INCONSISTENTE through the shared D-11 guard
expected: The pdf and portal arms reject a tampered mapping with MAPEO_INCONSISTENTE through the shared D-11 guard
result: pass
source: automated
coverage_id: 01-08/D6

### 78. armar_paquete reproduces the truth table: co and pa listo with no bloqueos, ec bloqueado by ausente certificado_cumplimiento_tributario, hn bloqueado by vencido parafiscales (2026-08-31)
expected: armar_paquete reproduces the truth table: co and pa listo with no bloqueos, ec bloqueado by ausente certificado_cumplimiento_tributario, hn bloqueado by vencido parafiscales (2026-08-31)
result: pass
source: automated
coverage_id: 01-09/D1

### 79. paquete/ holds the formulario, every presente and vencido soporte (byte-identical copies) and checklist.md; data.archivos lists sorted relative paths
expected: paquete/ holds the formulario, every presente and vencido soporte (byte-identical copies) and checklist.md; data.archivos lists sorted relative paths
result: pass
source: automated
coverage_id: 01-09/D2

### 80. checklist.md shows fecha de ejecución, LISTO/BLOQUEADO with motivos, the soportes table with 'vence en 27 días' and the emitter column, faltantes, por confirmar with nota and '- [ ]' actions
expected: checklist.md shows fecha de ejecución, LISTO/BLOQUEADO with motivos, the soportes table with 'vence en 27 días' and the emitter column, faltantes, por confirmar with nota and '- [ ]' actions
result: pass
source: automated
coverage_id: 01-09/D3

### 81. Expiry rules on ISO dates with the injected clock: expiry day valid, day after vencido, aviso at 0..30 days inclusive, none at 31, null vigencia valid
expected: Expiry rules on ISO dates with the injected clock: expiry day valid, day after vencido, aviso at 0..30 days inclusive, none at 31, null vigencia valid
result: pass
source: automated
coverage_id: 01-09/D4

### 82. armar_paquete before generar_formulario returns FORMULARIO_NO_GENERADO ('Primero genera el formulario...') and creates no paquete/
expected: armar_paquete before generar_formulario returns FORMULARIO_NO_GENERADO ('Primero genera el formulario...') and creates no paquete/
result: pass
source: automated
coverage_id: 01-09/D5

### 83. Two concurrent armar_paquete calls on co both succeed and leave one expected file set; a re-run removes foreign files from paquete/
expected: Two concurrent armar_paquete calls on co both succeed and leave one expected file set; a re-run removes foreign files from paquete/
result: pass
source: automated
coverage_id: 01-09/D6

### 84. Each armar_paquete call appends one line to out/log.jsonl and out/<caso>/log.jsonl with a states-and-codes resumen
expected: Each armar_paquete call appends one line to out/log.jsonl and out/<caso>/log.jsonl with a states-and-codes resumen
result: pass
source: automated
coverage_id: 01-09/D7

### 85. Copier containment: origin realpath inside repositorio/soportes or out/<caso> (not paquete/), destination allowlisted, symlinks out of the repository rejected; index schema rejects '..', reserved names and impossible dates
expected: Copier containment: origin realpath inside repositorio/soportes or out/<caso> (not paquete/), destination allowlisted, symlinks out of the repository rejected; index schema rejects '..', reserved names and impossible dates
result: pass
source: automated
coverage_id: 01-09/D8

### 86. paquete/ also contains borrador-correo.md, addressed to solicitud.de with 'RE: <asunto>', listing formulario and presente soportes, signed by contacto_financiero and razon_social
expected: paquete/ also contains borrador-correo.md, addressed to solicitud.de with 'RE: <asunto>', listing formulario and presente soportes, signed by contacto_financiero and razon_social
result: pass
source: automated
coverage_id: 01-10/D1

### 87. Pendientes paragraph for faltantes, ausentes and vencidos; nothing when empty
expected: Pendientes paragraph for faltantes, ausentes and vencidos; nothing when empty
result: pass
source: automated
coverage_id: 01-10/D2

### 88. No bank data or identifiers in borrador-correo.md, checklist.md or ENVIO-SIMULADO.md; a template asking for banco.* gives REGLAS_INVALIDAS and writes no borrador
expected: No bank data or identifiers in borrador-correo.md, checklist.md or ENVIO-SIMULADO.md; a template asking for banco.* gives REGLAS_INVALIDAS and writes no borrador
result: pass
source: automated
coverage_id: 01-10/D3

### 89. reglas.json text edits show up in the next output with no code change (D-28)
expected: reglas.json text edits show up in the next output with no code change (D-28)
result: pass
source: automated
coverage_id: 01-10/D4

### 90. proveedor.ts exports exactly the five PRD tools, each with a one-sentence description, args and execute
expected: proveedor.ts exports exactly the five PRD tools, each with a one-sentence description, args and execute
result: pass
source: automated
coverage_id: 01-10/D8

### 91. Truth table co 17/0/0 LISTO, ec 13/1/1 BLOQUEADO (ausente), hn 9/1/1 BLOQUEADO (vencido parafiscales 2026-08-31), pa 8/0/1 LISTO with formato no soportado
expected: Truth table co 17/0/0 LISTO, ec 13/1/1 BLOQUEADO (ausente), hn 9/1/1 BLOQUEADO (vencido parafiscales 2026-08-31), pa 8/0/1 LISTO with formato no soportado
result: pass
source: automated
coverage_id: 01-11/D2

### 92. Each case shows the unconfirmed send refused; no ENVIO-SIMULADO.md is written by the demo
expected: Each case shows the unconfirmed send refused; no ENVIO-SIMULADO.md is written by the demo
result: pass
source: automated
coverage_id: 01-11/D3

### 93. A corrupt plantilla case prints its Spanish error, the four real cases finish and the run reports failure; no package.json means nothing is deleted
expected: A corrupt plantilla case prints its Spanish error, the four real cases finish and the run reports failure; no package.json means nothing is deleted
result: pass
source: automated
coverage_id: 01-11/D4

### 94. No sensitive value in responses, stdout, logs, mapeo, checklist, borrador or ENVIO-SIMULADO, with a non-vacuous corpus and a positive control in the formularios
expected: No sensitive value in responses, stdout, logs, mapeo, checklist, borrador or ENVIO-SIMULADO, with a non-vacuous corpus and a positive control in the formularios
result: pass
source: automated
coverage_id: 01-11/D6

## Summary

total: 94
passed: 92
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "xlsx columns are wide enough to read every label and value (H1)"
  status: failed
  reason: "User reported: labels and values cut off in co/hn xlsx (no column widths)"
  severity: cosmetic
  test: 17
  gap_id: G-01-H1
  root_cause: "xlsx writer never sets column widths (no getColumn().width / <cols>), so viewers use the ~8.43-char default; used columns depend on the template (co B/C, hn A/B)"
  artifacts:
    - path: "src/infra/output/xlsx-writer.adapter.ts"
      issue: "writeXlsx (L41-51) has no width step"
    - path: "src/config/constants/xlsx.constants.ts"
      issue: "no width constants"
    - path: "tests/golden/formulario-xlsx.test.ts"
      issue: "no width/wrap asserts"
  missing:
    - "Per sheet, derive used columns from celda_etiqueta/celda_valor and set width = clamp(longest written text + margin, min, max) with constants in xlsx.constants.ts"
    - "wrapText on value cells longer than max"
    - "Golden test: co (B,C) and hn (A,B) widths >= longest label and <= max; boundary tests"
  debug_session: ".planning/debug/xlsx-anchos-columna.md"
- truth: "ENVIO-SIMULADO lists only the files actually sent to the client (H4a)"
  status: failed
  reason: "User reported: ENVIO-SIMULADO lists checklist.md and borrador-correo.md (internal) as sent"
  severity: minor
  test: 20
  gap_id: G-01-H4a
  root_cause: "ENVIO-SIMULADO sent list is the raw paquete/ listing minus expired supports; internal checklist.md and borrador-correo.md are never excluded, and the WR-06 rename to \"Archivos que se envían\" turned the listing into a false claim"
  artifacts:
    - path: "src/domain/builders/borrador.builder.ts"
      issue: "construirDatosEnvio (L59-84) only splits expired"
    - path: "src/application/use-cases/simular-envio.use-case.ts"
      issue: "L29-30 sent list from listarPaquete"
    - path: "src/knowledge/plantillas/envio-simulado.md"
      issue: "L10-14 heading"
    - path: "tests/golden/borrador-envio.test.ts"
      issue: "no exclusion assert"
  missing:
    - "Build the sent list from domain state like the borrador (formulario + soportes presente), keep the folder listing for the expired section / existence check"
    - "Golden: checklist.md and borrador-correo.md never in the sent list for co, ec, hn"
  debug_session: ".planning/debug/envio-lista-internos.md"
- truth: "The borrador never claims the form is signed while the case is blocked or has fields to confirm (H4b)"
  status: failed
  reason: "User reported: borrador says firmado por el representante legal while BLOQUEADO / RUC por confirmar — asserts something not true"
  severity: major
  test: 20
  gap_id: G-01-H4b
  root_cause: "borrador-correo.md states \"firmado por el representante legal\" unconditionally, and construirDatosBorrador drops listo_para_firma, bloqueos and requiere_confirmacion from the Checklist it receives, so the template cannot vary by state (unknown sections are rejected)"
  artifacts:
    - path: "src/knowledge/plantillas/borrador-correo.md"
      issue: "L6 unconditional signed claim"
    - path: "src/domain/builders/borrador.builder.ts"
      issue: "L28-36, L41-59 drop state"
    - path: "src/domain/types/borrador.type.ts"
      issue: "L6-17 no state fields"
    - path: "src/config/strings.ts"
      issue: "TEXTO_BORRADOR L81-84"
    - path: "tests/golden/borrador-envio.test.ts"
      issue: "no state asserts"
  missing:
    - "Expose package state (listo/bloqueado, bloqueos, por confirmar labels) in DatosBorradorCorreo from the Checklist"
    - "Template wording only states tool-produced facts: para firma / una vez firmado; blocked wording never presents the form as final"
    - "Goldens: ec/hn never contain firmado; pa (LISTO + por confirmar) never claims final"
    - "Related: pa borrador attaches valores-portal.md though portal has no attachment"
  debug_session: ".planning/debug/borrador-afirma-firmado.md"
- truth: "The borrador shows human-readable support names (H4c)"
  status: failed
  reason: "User reported: borrador shows snake_case ids like certificado_cumplimiento_tributario"
  severity: cosmetic
  test: 20
  gap_id: G-01-H4c
  root_cause: "No mapping from soporte tipo (machine key) to a human name; builders copy SoporteEvaluado.tipo verbatim into borrador, checklist table/actions/motivos and ENVIO bloqueos; fixtures cannot supply names (index descripcion describes a file and is absent for ausente types)"
  artifacts:
    - path: "src/domain/builders/borrador.builder.ts"
      issue: "L23, L33, L34, L82"
    - path: "src/domain/builders/checklist.builder.ts"
      issue: "L15, L17, L48, L71, L74"
    - path: "src/config/strings.ts"
      issue: "L77-78, L83; no names table"
    - path: "src/domain/types/soportes.type.ts"
      issue: "SoporteEvaluado has no name"
  missing:
    - "Typed zod-validated tipo→nombre table (reglas.json soportes.nombres or strings.ts — product decision); unknown tipo renders the raw id"
    - "Keep tipo as machine key in tool data/logs (contract v1); resolve names only in human-facing outputs"
    - "Update goldens on purpose; guard: no known soporte id in human-facing files; test unknown tipo renders safely"
  debug_session: ".planning/debug/borrador-ids-snake-case.md"
