---
phase: 05
review: 05-REVIEW.md
titles: json
findings:
  - id: IN-01
    severity: info
    disposition: fixed
    title: "The IN-08 fix opens a second channel for the 401 message and marks a code the server just accepted as invalid"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The composer re-derives the \"can send\" rule instead of reading `seleccionarEnvioDeshabilitado`"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "W20 still lets a feature read the store context through React 19 `use(ContextoAlmacen)`"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "W4 is still a denylist, and it misses the impurities that matter most for pure reducers"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "The \"en curso\" icon and its reduced-motion CSS are duplicated between two features"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The file-preview modal lives inside an auto-collapsing `<details>`, so it can vanish while the page stays inert"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Guardian false negatives in W24 and in the store-primitive rule"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "Views still make decisions that belong in their hooks"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "Quick actions and the \"procesar de nuevo\" chip stay enabled during hydration, and their clicks are silently dropped"
  - id: IN-08
    severity: info
    disposition: fixed
    title: "A login that succeeds, followed by a 401 on `/api/config`, fails silently"
  - id: IN-09
    severity: info
    disposition: fixed
    title: "The root id and the global classes are copied by hand, and a mismatch fails silently"
  - id: IN-10
    severity: info
    disposition: fixed
    title: "Hook API churn and inconsistency in the small `control*` helpers"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "el estado vacío decía \"Cargando los casos…\" para siempre cuando `/api/config` fallaba"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "las vistas llevaban manejadores en línea"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "las constantes de marca no eran la fuente de verdad"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "falsos negativos de los guardianes"
open: 0
total: 16
recorded: 2026-10-16T21:49:55.777Z
---

# Phase 05: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| IN-01 | info | fixed | 05-REVIEW-FIX.md |
| IN-02 | info | fixed | 05-REVIEW-FIX.md |
| IN-03 | info | fixed | 05-REVIEW-FIX.md |
| IN-04 | info | fixed | 05-REVIEW-FIX.md |
| IN-05 | info | fixed | 05-REVIEW-FIX.md |
| WR-01 | warning | fixed | 05-REVIEW-FIX.iter2.md (not in the current review) |
| WR-02 | warning | fixed | 05-REVIEW-FIX.iter2.md (not in the current review) |
| IN-06 | info | fixed | 05-REVIEW-FIX.iter2.md (not in the current review) |
| IN-07 | info | fixed | 05-REVIEW-FIX.iter2.md (not in the current review) |
| IN-08 | info | fixed | 05-REVIEW-FIX.iter2.md (not in the current review) |
| IN-09 | info | fixed | 05-REVIEW-FIX.iter2.md (not in the current review) |
| IN-10 | info | fixed | 05-REVIEW-FIX.iter2.md (not in the current review) |
| WR-03 | warning | fixed | 05-REVIEW-FIX.iter1.md (not in the current review) |
| WR-04 | warning | fixed | 05-REVIEW-FIX.iter1.md (not in the current review) |
| WR-05 | warning | fixed | 05-REVIEW-FIX.iter1.md (not in the current review) |
| WR-06 | warning | fixed | 05-REVIEW-FIX.iter1.md (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
