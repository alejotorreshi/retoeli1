---
phase: 05
review: 05-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "`CASO_DEMO_PRD` is a literal copy of the backend's `CASO_GUION_PRD` (D-124 single source violated, W23 blind to it)"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The composer placeholder hardcodes the demo slug instead of deriving it from its constant"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The empty state says \"Cargando los casos…\" forever when `/api/config` fails, and the status is not announced"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "Views still carry behavior (inline handlers that build arguments and messages), and W15 cannot see it"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "The brand constants are not the source of truth; `index.html` and `global.css` hardcode the same values"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "Guardian false negatives: violations that the W rules let through silently"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "Dead code and test-only exports"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "`memoizarPorReferencia` treats a cached `undefined` as a miss"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "`use*` names on functions that are not hooks, and a hook shared across component folders"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "The empty state hands focus over through a global DOM id"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "The login flow passes a signal that can never be aborted"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "The document title is written twice"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "Layout breakpoints and the layout code are duplicated in CSS, in a different unit"
  - id: IN-08
    severity: info
    disposition: fixed
    title: "`LogoMarca` can render `class=\"… undefined\"`"
  - id: IN-09
    severity: info
    disposition: fixed
    title: "Timing sleeps in the DOM tests"
  - id: IN-10
    severity: info
    disposition: fixed
    title: "Small structure and documentation drift"
open: 0
total: 16
recorded: 2026-10-16T20:38:42.435Z
---

# Phase 05: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| WR-02 | warning | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| WR-03 | warning | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| WR-04 | warning | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| WR-05 | warning | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| WR-06 | warning | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-01 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-02 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-03 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-04 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-05 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-06 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-07 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-08 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-09 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |
| IN-10 | info | fixed | 05-REVIEW-FIX.md (commits 4db7d61..2169bcc) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
