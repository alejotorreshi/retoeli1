---
phase: 01
review: 01-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "Empty or whitespace-only master values are mapped as `lleno`"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "PDF silently replaces characters outside WinAnsi with `?` in filled values"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Boolean and array master values are reported as \"no existe en el maestro\""
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "RN1 holds only while `reglas.json` keeps `regla_pais`/`etiqueta_generica` below the threshold"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "A generic label with no glossary entry is `requiere_confirmacion` in `leer_solicitud` but `faltante` in `mapear_campos`"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "Support evaluation uses the first index entry per `tipo` and ignores newer duplicates"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "Expired supports are copied into the package and listed as sent, while the email says they will follow"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "Failed regeneration leaves a stale form that `armar_paquete` accepts"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "Template schema accepts sheet names and cells that crash or corrupt the xlsx writer"
  - id: WR-09
    severity: warning
    disposition: fixed
    title: "The PII-absence e2e proof only checks four identifiers"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "Spanish plural bug in the expiry notice"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "Markdown-table escaping is applied to the plain-text email"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "`relojFijo.ahora()` uses real wall-clock time"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "Demo has a dead safety check, mutates `process.env` globally and wipes all audit logs"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "The per-case log is skipped when args fail validation"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "The system clock relies on the `en-CA` locale's date format"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "A case with both templates is rejected instead of choosing by format"
  - id: IN-08
    severity: info
    disposition: fixed
    title: "`soportesPresentes` swallows directory errors"
  - id: IN-09
    severity: info
    disposition: fixed
    title: "Note variables are a mostly dead path, and the rules' templates are not validated at load"
  - id: IN-10
    severity: info
    disposition: fixed
    title: "Type-only import cycle, and config enums duplicated from domain types"
  - id: IN-11
    severity: info
    disposition: skipped
    title: "Dependency versions drift from the documented stack, and `check` needs the network"
  - id: IN-12
    severity: info
    disposition: fixed
    title: "`sessionId` has no length bound before it is written to every log line"
open: 0
total: 22
recorded: 2026-10-13T00:16:00.293Z
---

# Phase 01: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 01-REVIEW-FIX.md |
| WR-01 | warning | fixed | 01-REVIEW-FIX.md |
| WR-02 | warning | fixed | 01-REVIEW-FIX.md |
| WR-03 | warning | fixed | 01-REVIEW-FIX.md |
| WR-04 | warning | fixed | 01-REVIEW-FIX.md |
| WR-05 | warning | fixed | 01-REVIEW-FIX.md |
| WR-06 | warning | fixed | 01-REVIEW-FIX.md |
| WR-07 | warning | fixed | 01-REVIEW-FIX.md |
| WR-08 | warning | fixed | 01-REVIEW-FIX.md |
| WR-09 | warning | fixed | 01-REVIEW-FIX.md |
| IN-01 | info | fixed | 01-REVIEW-FIX.md |
| IN-02 | info | fixed | 01-REVIEW-FIX.md |
| IN-03 | info | fixed | 01-REVIEW-FIX.md |
| IN-04 | info | fixed | 01-REVIEW-FIX.md |
| IN-05 | info | fixed | 01-REVIEW-FIX.md |
| IN-06 | info | fixed | 01-REVIEW-FIX.md |
| IN-07 | info | fixed | 01-REVIEW-FIX.md |
| IN-08 | info | fixed | 01-REVIEW-FIX.md |
| IN-09 | info | fixed | 01-REVIEW-FIX.md |
| IN-10 | info | fixed | 01-REVIEW-FIX.md |
| IN-11 | info | skipped | 01-REVIEW-FIX.md |
| IN-12 | info | fixed | 01-REVIEW-FIX.md |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
