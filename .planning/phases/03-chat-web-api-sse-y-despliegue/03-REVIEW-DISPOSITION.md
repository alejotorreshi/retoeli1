---
phase: 03
review: 03-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "El desalojo por `maxKeys` levanta bloqueos activos (falla abierto), también el anti fuerza bruta de `/api/acceso`"
  - id: WR-02
    severity: warning
    disposition: open
    title: "\"Nueva sesión\" ya no olvida el `sessionId` guardado: al recargar vuelve la sesión anterior con sus confirmaciones activas, contra lo que promete el diálogo"
  - id: WR-03
    severity: warning
    disposition: open
    title: "El seguimiento del scroll descarta desplazamientos reales de la usuaria fuera de la ventana de 600 ms y el `ResizeObserver` la devuelve al final mientras lee"
  - id: IN-01
    severity: info
    disposition: open
    title: "Un `proveedor_simular_envio` de un paso truncado no recibe el aviso de D-76"
  - id: IN-02
    severity: info
    disposition: open
    title: "\"Volver a la sesión anterior\" se ofrece ante cualquier 429, aunque no tenga que ver con el tope de sesiones"
  - id: IN-03
    severity: info
    disposition: open
    title: "El mensaje de bloqueo de acceso no usa singular ni el tiempo restante"
  - id: IN-04
    severity: info
    disposition: open
    title: "`cierreConPregunta` quedó como código de producción que solo usan los tests"
  - id: IN-05
    severity: info
    disposition: open
    title: "`CRECIMIENTO` marca \"contenido nuevo\" también cuando el contenido se achica"
open: 8
total: 8
recorded: 2026-10-15T18:23:36.828Z
---

# Phase 03: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
