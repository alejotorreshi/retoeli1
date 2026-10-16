---
phase: 05
review: 05-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "`CASO_DEMO_PRD` is a literal copy of the backend's `CASO_GUION_PRD` (D-124 single source violated, W23 blind to it)"
  - id: WR-02
    severity: warning
    disposition: open
    title: "The composer placeholder hardcodes the demo slug instead of deriving it from its constant"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The empty state says \"Cargando los casos…\" forever when `/api/config` fails, and the status is not announced"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Views still carry behavior (inline handlers that build arguments and messages), and W15 cannot see it"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The brand constants are not the source of truth; `index.html` and `global.css` hardcode the same values"
  - id: WR-06
    severity: warning
    disposition: open
    title: "Guardian false negatives: violations that the W rules let through silently"
  - id: IN-01
    severity: info
    disposition: open
    title: "Dead code and test-only exports"
  - id: IN-02
    severity: info
    disposition: open
    title: "`memoizarPorReferencia` treats a cached `undefined` as a miss"
  - id: IN-03
    severity: info
    disposition: open
    title: "`use*` names on functions that are not hooks, and a hook shared across component folders"
  - id: IN-04
    severity: info
    disposition: open
    title: "The empty state hands focus over through a global DOM id"
  - id: IN-05
    severity: info
    disposition: open
    title: "The login flow passes a signal that can never be aborted"
  - id: IN-06
    severity: info
    disposition: open
    title: "The document title is written twice"
  - id: IN-07
    severity: info
    disposition: open
    title: "Layout breakpoints and the layout code are duplicated in CSS, in a different unit"
  - id: IN-08
    severity: info
    disposition: open
    title: "`LogoMarca` can render `class=\"… undefined\"`"
  - id: IN-09
    severity: info
    disposition: open
    title: "Timing sleeps in the DOM tests"
  - id: IN-10
    severity: info
    disposition: open
    title: "Small structure and documentation drift"
open: 16
total: 16
recorded: 2026-10-16T20:17:57.878Z
---

# Phase 05: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |
| IN-09 | info | open | - |
| IN-10 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
