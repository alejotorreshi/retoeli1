---
phase: quick-261014-jz4
plan: 01
subsystem: compuerta-de-confirmacion
tags: [confirmacion, prompt, conocimiento, seguridad, registros]
status: complete
requires: [02-24]
provides: [D-63.11, FILAS_D6311, AR-02-06]
affects: [phase-02-re-verification, SOLUCION.md (Fase 4)]
tech-stack:
  added: []
  patterns: [pin current classifier behavior as declared rows, verbatim prose pins classified with one and two pending cases]
key-files:
  created: []
  modified:
    - .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md
    - tests/unit/confirmacion.policy.test.ts
    - agent/prompt.md
    - tests/contract/instrucciones-agente.test.ts
    - src/knowledge/registro-proveedor.md
    - .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-VERIFICATION.md
    - .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-SECURITY.md
    - .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-REVIEW-DISPOSITION.md
decisions:
  - "D-63.11: la usuaria acepta la regla de primera palabra (2026-10-14); un pedido sobre el caso pendiente con otra palabra delante del verbo cancela, del lado seguro; el clasificador no cambia"
  - "T-02-83 pasa a accept con AR-02-06; CR-06 queda skipped (decisión de no arreglar) y WR-27 fixed"
metrics:
  duration: "~6 min"
  completed: 2026-10-14
actuals:
  tokens: 13100
  tasks: 3
  commits: 3
plan_head_before: e6ed4a1878fc741ea42e09ffbdf51f8cc5b29304
plan_head_after: 7b5ed7db1113170a6e32f97b1d503e1f671cedd7
---

# Quick 261014-jz4: aceptar la regla de primera palabra (D-63.11) Summary

CR-06 / T-02-83 se cierran sin tocar el clasificador. D-63.11 enmienda D-63.10(d), FILAS_D6311 fija 16 filas de la conducta actual, `prompt.md:54` y RN4 quedan acotados a la regla de primera palabra (y fijados palabra por palabra con uno y dos pendientes), y los registros de la fase 02 tienen overrides, AR-02-06 y la disposición del ledger.

## Commits

| Task | Name | Commit |
|------|------|--------|
| 1 | D-63.11, FILAS_D6311, prompt.md:54 (TX-P54) y la oración "prompt SCASO" en el contrato | 230beb0 |
| 2 | RN4 con "de otro caso" (WR-27) y RN4c; "conocimiento RN4c" en el contrato | d241352 |
| 3 | Overrides de las verdades 31 y 41, T-02-83 accept (AR-02-06), T-02-84/85, CR-06 skipped, WR-27 fixed | 7b5ed7d |

## Verificación

- `bun test` (suite completa, una vez): **1551 pass, 1 skip, 0 fail** (1552 pruebas en 72 archivos, 6822 expect).
- `bun run check` (tsc + Biome + bun audit): exit 0, sin vulnerabilidades.
- `git diff --quiet 9207112 -- src/domain src/config reto-01`: limpio. `git diff --name-only 9207112 -- src reto-01` lista solo `src/knowledge/registro-proveedor.md`.
- El describe D-63.11 corre 16 filas en verde. ORACIONES_D639 tiene siete oraciones, y cada rechazo citado rechaza con uno y con dos pendientes.
- En 02-CONTEXT.md, la frase "ningún pedido que nombra un caso cancela" aparece una sola vez, citada como retirada en el ítem 11.
- Los frontmatter de VERIFICATION, SECURITY y REVIEW-DISPOSITION se leen como YAML válido: 2 overrides con D-63.11, CR-06 skipped, WR-27 fixed, `open: 34` coincide con el conteo y `threats_open: 0`.

## Deviations from Plan

**1. [Ajuste menor] Componente de la fila T-02-83 en 02-SECURITY.md.** El texto dice ahora "...does not start with a VERBOS_DE_PEDIDO word right after a wait response cancels it". Se quitaron "now" y el paréntesis "(unregistered, found by the 02-24 audit)", y se añadió "right after a wait response" para que describa la conducta actual. No cambia ninguna verificación.

**2. [Nota de proceso] Commits en `main`.** El orquestador indicó modo secuencial en el árbol principal (rama main), así que los tres commits van directo a main, como el resto del historial del proyecto. El guard de pin de la raíz salió con exit 0 antes de cada edición y de cada commit.

Por lo demás, el plan se ejecutó tal como estaba escrito. Los textos TX-P54, TX-SCASO, TX-RN4b, TX-RN4c, TX-D6311 y TX-FILAS se escribieron literales.

## Notas

- **La fase 02 necesita una re-verificación** para aplicar los overrides de las verdades 31 y 41. Status, score y `overrides_applied` de 02-VERIFICATION.md quedan intactos a propósito.
- **La limitación AR-02-06** (un pedido sobre el caso pendiente con un relleno, un conector, un modal o un enclítico delante del verbo cancela, del lado seguro) se lleva a SOLUCION.md en la Fase 4. El botón estructurado (D-39) llega en la Fase 3.
- Fuera de alcance, por decisión de la usuaria: cualquier cambio de gramática (el arreglo de CR-06 propuesto en 02-REVIEW.md, el generador `nuncaCancelanPedidoDelPendiente` y la quinta dirección del diferencial).

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: los 8 archivos modificados existen.
- FOUND: 230beb0, d241352 y 7b5ed7d son ancestros de HEAD (`git rev-list --count e6ed4a1..HEAD` = 3).
