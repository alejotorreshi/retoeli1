---
phase: 04
review: 04-REVIEW.md
review_fix: 04-REVIEW-FIX.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "`preflight --guion` always fails against Render because it requires `X-Accel-Buffering: no` at the client, and Render's edge strips it"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "Most of the guion validator's failure branches have no tests"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The module byte-equality guarantee depends on line endings, and the repo has no `.gitattributes`"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The pre-flight reports a turn as OK even when it ended on a cap rather than normally"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "Spawned-process tests claim an \"empty environment\", but Bun auto-loads `.env` from `cwd`"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The README overstates what the default pre-flight waits for, and an invalid health body keeps the loop polling"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The README says the cookie is always `Secure`, but the code drops `Secure` in development"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "`docs/convenciones.md` G1 omits the `@modulo/` alias"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "SOLUCION's peak-hour window and its \"valle\" claim are not backed by any constant or by the evidence"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "`actions/checkout` keeps the default `persist-credentials: true`"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "The module generator resolves the root from `process.cwd()` and writes its two files non-atomically"
  - id: IN-08
    severity: info
    disposition: fixed
    title: "`--url \"\"` silently overrides `PREFLIGHT_URL`, and a URL path is silently dropped"
---

# Disposición del code review de la fase 04

Los 12 hallazgos de 04-REVIEW.md se corrigieron en una sola pasada del fixer, con un commit atómico cada uno (ver 04-REVIEW-FIX.md, status all_fixed). Hay que verificar CR-01 contra Render: lo cubre eli-qa con `bun run preflight -- --guion`.
