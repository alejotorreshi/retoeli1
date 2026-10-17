---
status: complete
phase: 01-n-cleo-determinista
source: [01-VERIFICATION.md, 01-REVIEW-FIX.md, 01-12-SUMMARY.md, 01-13-SUMMARY.md, 01-14-SUMMARY.md, 01-15-SUMMARY.md]
started: 2026-10-13T04:32:44Z
updated: 2026-10-13T15:11:07Z
---

## Current Test

[testing complete]

## Tests

### 1. Repetir prueba 17 de UAT — anchos de columna del xlsx en Excel/LibreOffice
expected: Tras `bun run demo.ts`, abrir out/co-industrias-delta/formulario.xlsx (Datos Proveedor y Datos Bancarios) y out/hn-agroexport-sula/formulario.xlsx: cada etiqueta y valor se lee completo, sin columnas recortadas; 'Actividad económica' (Datos Proveedor!C13) ajusta en varias líneas dentro de una columna de ancho 60; se conservan negritas, rellenos y notas de faltante / por confirmar.
result: pass
note: pass (humano: xlsx abiertos en Excel, sin recortes)

### 2. Repetir prueba 20 de UAT — tono del borrador y del registro de envío (WR-01, WR-02)
expected: Leer out/<caso>/paquete/borrador-correo.md de los 4 casos y un ENVIO-SIMULADO.md confirmado. El tono es profesional para el cliente, y se decide explícitamente sobre (a) WR-01: en ec el correo promete enviar "por separado" el Número de contribuyente especial, que no existe en el maestro; (b) WR-02: el correo copia la nota interna "RUC: Identificador extranjero: confirmar si el cliente acepta el NIT colombiano".
result: pass
note: pass (humano: tono aceptable)

### 3. CR-01 resuelto — un paquete/ desactualizado o incompleto rechaza el envío simulado
expected: Con paquete/ sin un archivo para el cliente (soporte borrado, formulario borrado o soporte renovado entre armar_paquete y simular_envio), simular_envio confirmado responde ok:false con codigo PAQUETE_DESACTUALIZADO, lista los archivos faltantes, pide volver a correr proveedor_armar_paquete y no escribe ENVIO-SIMULADO.md; tras re-armar, el envío confirmado funciona. La persona aprueba este enfoque (rechazo en vez de bloqueo) y la nota para el agente de la Fase 2.
result: pass
note: pass (asserts 4/4; enfoque PAQUETE_DESACTUALIZADO aprobado; nota Fase 2: el agente re-arma el paquete y vuelve a pedir confirmación)

### 4. Decidir WR-03 de la revisión — stdout de la demo con ids crudos de soporte
expected: Confirmar que la salida de `bun run demo.ts` y el `resumen` de las herramientas conservan ids crudos (contrato v1, D-21) y documentarlo en SOLUCION.md, o pedir un plan para mostrar nombres en la demo.
result: pass
note: pass (humano: se mantienen ids crudos en la consola de la demo — PRD §6.6 solo pide "un resumen por caso"; documentar en SOLUCION.md)

### 5. Regresión T01: Cold start: quality gates green from scratch
expected: check exits 0 (tsc strict, Biome, bun audit clean); bun test exits 0 with 0 fail; no skipped or todo tests
result: pass

### 6. Regresión T02: Demo without LLM key: four cases end to end
expected: exit 0, prints the effective execution date line; Resumen table: co xlsx 17/0/0 LISTO, ec pdf 13/1/1 BLOQUEADO, hn xlsx 9/1/1 BLOQUEADO, pa portal 8/0/1 LISTO; simular_envio unconfirmed answers 'requiere confirmación explícita' and nothing is sent; out/<caso>/ holds formulario (xlsx|pdf|valores-portal.md), mapeo.json, paquete/ and log.jsonl for each case
result: pass

### 7. Regresión T03: Determinism across runs and roots
expected: identical stdout across the three runs; identical file list and content modulo documented volatile fields; no absolute path of either root in any output
result: pass

### 8. Regresión T04: simular_envio confirmation gate (ENV-01)
expected: false and missing give ok:false, codigo CONFIRMACION_REQUERIDA, error exactly 'requiere confirmación explícita', no file written; string "true" gives ARGS_INVALIDOS; true without paquete gives PAQUETE_NO_ARMADO; true with paquete writes only ENVIO-SIMULADO.md listing only client files present in paquete/ (never checklist.md or borrador-correo.md) and the current bloqueos by display name, without requiring listo_para_firma; true with paquete/ missing a client file (deleted soporte, deleted formulario, or soporte renewed between armar_paquete and simular_envio) gives ok:false, codigo PAQUETE_DESACTUALIZADO, lists the missing files, asks to re-run proveedor_armar_paquete, and writes no ENVIO-SIMULADO.md (CR-01 fix)
result: pass

### 9. Regresión T05: Reprocessing after a send cleans stale outputs (D-12)
expected: paquete/ and ENVIO-SIMULADO.md no longer exist; a fresh formulario exists
result: pass

### 10. Regresión T06: Audit logs on every call (SEG-04, RN5)
expected: one line per call in out/log.jsonl; one line per call with a resolved caso in out/<caso>/log.jsonl; fields only ts, herramienta, ok, resumen (+ sesion, caso, codigo); the marker value never appears
result: pass

### 11. Regresión T07: Blank maestro value becomes faltante (CR-01 regression)
expected: mapear_campos counts both as faltante; xlsx cells carry the faltante mark; checklist lists both under Campos faltantes; borrador mentions them as pending
result: pass

### 12. Regresión T08: Non-text maestro values need confirmation (WR-02)
expected: the boolean field is requiere_confirmacion with a note and no value; no 'Sí/No' or joined text is written to the form
result: pass

### 13. Regresión T09: RN1 enforced in code, not by data (WR-03)
expected: ec RUC stays requiere_confirmacion; the generic tax-id label stays requiere_confirmacion
result: pass

### 14. Regresión T10: Generic label consistency between tools (WR-04)
expected: leer_solicitud lists it in ambiguos with the country proposal; mapear_campos marks it requiere_confirmacion with the same proposal, not faltante
result: pass

### 15. Regresión T11: Newest support entry wins (WR-05)
expected: the renewed entry is evaluated (presente); the package is not blocked by the old copy
result: pass

### 16. Regresión T12: Expired support is consistent across package, send and email (WR-06)
expected: parafiscales is in paquete/ and marked vencido in the checklist; ENVIO-SIMULADO lists it under 'Soportes vencidos que no se envían'; the borrador names it 'Certificación de aportes parafiscales' as a pending soporte to be sent separately, never as attached, and never says 'firmado'
result: pass

### 17. Regresión T13: Both templates present: the format decides (IN-07)
expected: xlsx uses plantilla-celdas.json; pdf and portal use plantilla-campos.json; no PLANTILLA_INVALIDA
result: pass

### 18. Regresión T14: Checklist shows the issuing country (WR-17)
expected: 'País emisor' column holds a country code for every support; warnings live in the 'Aviso de emisor' column; armar_paquete returns pais_emisor per support
result: pass

### 19. Regresión T15: No PII outside the forms (broad scan)
expected: zero hits outside formulario and valores-portal.md; positive control: values found in formulario.xlsx and valores-portal.md
result: pass

### 20. Regresión T16: Model-facing tool contract (CA2, WR-18)
expected: exactly the five PRD exports; one-sentence descriptions; every tool reference in model-facing text uses the proveedor_ prefix; schemas have additionalProperties false and the locked field names
result: pass

## Summary

total: 20
passed: 20
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]

## Follow-Ups

- SOLUCION.md: explicar que la consola de `demo.ts` y el `resumen` de las herramientas usan los ids canónicos de soporte (contrato v1), y que checklist/borrador/ENVIO usan nombres en español (WR-03, IN-01).
- Fase 2: el prompt del agente responde a `PAQUETE_DESACTUALIZADO` re-ejecutando `proveedor_armar_paquete`, mostrando el nuevo estado y pidiendo confirmación de nuevo (CR-01).

## Decisiones posteriores a la corrida (2026-10-13)

Tomadas por la persona tras la re-revisión del fix (ciclo 2), verificadas por el verificador sin nuevas pruebas humanas:
- Frase del correo cuando solo quedan datos bancarios por validar internamente: "Validaremos internamente algunos datos del formulario antes de pasarlo a la firma de nuestro representante legal." (WR-01, aprobada).
- Archivos basura del sistema operativo (`.DS_Store`, `Thumbs.db`, `desktop.ini`) no cuentan como sobrantes en `paquete/`; cualquier otro archivo extra sigue rechazando el envío con `PAQUETE_DESACTUALIZADO` (commit bdc4ba4).
- Al enviar se compara el borrador pero no `checklist.md` (lleva fecha); un borrador editado a mano exige volver a correr `proveedor_armar_paquete` (CR-01, aprobado).
