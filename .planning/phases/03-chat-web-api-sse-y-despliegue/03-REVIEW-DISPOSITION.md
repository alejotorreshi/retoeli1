---
phase: 03
review: 03-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "La reserva de D-77.2 responde 429 a credenciales válidas cuando llegan juntas, y el texto anuncia un bloqueo de 15 minutos que no existe"
  - id: WR-02
    severity: warning
    disposition: open
    title: "`eventoDeTruncado` marca como \"confirmado\" un truncado cuya autorización ya se gastó, y el aviso miente sobre la causa"
  - id: IN-01
    severity: info
    disposition: open
    title: "Una reserva cuya clave se desaloja durante el `await` queda como golpe fantasma en otra IP"
  - id: IN-02
    severity: info
    disposition: open
    title: "El documento acota los 50 000 intentos \"contra `/api/acceso`\", pero el Bearer comparte el mismo limitador"
  - id: IN-03
    severity: info
    disposition: open
    title: "Las filas de concurrencia de D-77.2 con códigos correctos afirman \"al menos una vez\" en vez del valor determinista"
  - id: IN-04
    severity: info
    disposition: open
    title: "La comprobación exhaustiva con `never` está solo en `aplicarEvento`"
  - id: CR-01
    severity: critical
    disposition: open
    title: "El cupo de desalojos permite saturar cualquier limitador con K + L peticiones de un golpe y no con K × L, y la documentación subestima ese costo cinco veces"
  - id: WR-03
    severity: warning
    disposition: open
    title: "Un `simular_envio` truncado de un caso que la usuaria confirmó responde \"falta tu confirmación explícita\""
  - id: WR-04
    severity: warning
    disposition: open
    title: "Con crecimiento entre pulsaciones, una subida de menos de 96 px se deshace y la usuaria no logra despegarse con flechas, la rueda de Firefox o el trackpad lento"
  - id: IN-05
    severity: info
    disposition: open
    title: "`aplicarEvento` no tiene comprobación de exhaustividad"
open: 10
total: 10
recorded: 2026-10-15T23:24:56.156Z
---

# Phase 03: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| CR-01 | critical | open | - (not in the current review) |
| WR-03 | warning | open | - (not in the current review) |
| WR-04 | warning | open | - (not in the current review) |
| IN-05 | info | open | - (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
