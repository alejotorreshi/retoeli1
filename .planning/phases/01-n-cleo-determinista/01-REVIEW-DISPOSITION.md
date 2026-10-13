---
phase: 01
review: 01-REVIEW.md
titles: json
findings:
  - id: WR-21
    severity: warning
    disposition: fixed
    title: "Domain, tools and demo logic sit loose at their layer root with no role folder (complete rename and split table)"
  - id: WR-22
    severity: warning
    disposition: fixed
    title: "The G5 suffix table, three exact-path guard keys and the CLAUDE.md rule encode \"el dominio va sin sufijo\""
  - id: WR-23
    severity: warning
    disposition: fixed
    title: "Unit test names do not mirror the modules they test, and G5 forbids the mirrored names"
  - id: WR-24
    severity: warning
    disposition: fixed
    title: "The tax-identifier rule is computed twice, in `solicitud.ts` and in `mapeo.ts`"
  - id: IN-20
    severity: info
    disposition: fixed
    title: "Three groups of domain types no longer sit next to their module's name"
  - id: IN-21
    severity: info
    disposition: fixed
    title: "Exported names that no longer match their role"
  - id: IN-22
    severity: info
    disposition: fixed
    title: "Test-only exports and a dead branch"
  - id: WR-10
    severity: warning
    disposition: fixed
    title: "Exported types live in logic files (rule 1)"
  - id: WR-11
    severity: warning
    disposition: fixed
    title: "Magic strings for codes and states, and enums built from arrays instead of `as const` objects (rule 2)"
  - id: WR-12
    severity: warning
    disposition: fixed
    title: "File names do not encode their role, and roles are not separated by folder (rule 3)"
  - id: WR-13
    severity: warning
    disposition: fixed
    title: "One `constantes.ts` for everything, plus about 40 scattered constants (rule 4)"
  - id: WR-14
    severity: warning
    disposition: fixed
    title: "User-facing text is hardcoded in 22 files, with copies of the same sentence (rule 5)"
  - id: WR-15
    severity: warning
    disposition: fixed
    title: "Config is not split into pure and env parts, and layering workarounds follow from that (rule 6)"
  - id: WR-16
    severity: warning
    disposition: fixed
    title: "227 relative parent imports; adopt one `@/*` alias (rule 7)"
  - id: WR-17
    severity: warning
    disposition: fixed
    title: "The checklist column \"País emisor\" shows the issuer warning, never the country"
  - id: WR-18
    severity: warning
    disposition: fixed
    title: "Model-facing text names the tools inconsistently (`generar_formulario` vs `proveedor_mapear_campos`)"
  - id: WR-19
    severity: warning
    disposition: fixed
    title: "Path-containment and FS-error helpers are duplicated across infra, with diverging semantics"
  - id: WR-20
    severity: warning
    disposition: fixed
    title: "Infra and tools naming language contradicts CLAUDE.md"
  - id: IN-13
    severity: info
    disposition: fixed
    title: "Exported constants are re-hardcoded instead of imported, and summary phrases are duplicated"
  - id: IN-14
    severity: info
    disposition: fixed
    title: "Small helper duplicates"
  - id: IN-15
    severity: info
    disposition: fixed
    title: "Port fields and exports with no consumer"
  - id: IN-16
    severity: info
    disposition: fixed
    title: "Overloaded names: \"plantilla\" means three things, \"reglas\" two"
  - id: IN-17
    severity: info
    disposition: fixed
    title: "Function shape and naming"
  - id: IN-18
    severity: info
    disposition: fixed
    title: "Use cases import other use cases"
  - id: IN-19
    severity: info
    disposition: fixed
    title: "`ARCHIVOS_SALIDA` mixes names and `paquete/` paths, and the write whitelist is wider than its callers"
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
total: 47
recorded: 2026-10-13T01:53:23.379Z
---

# Phase 01: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-21 | warning | fixed | 01-REVIEW-FIX.md |
| WR-22 | warning | fixed | 01-REVIEW-FIX.md |
| WR-23 | warning | fixed | 01-REVIEW-FIX.md |
| WR-24 | warning | fixed | 01-REVIEW-FIX.md |
| IN-20 | info | fixed | 01-REVIEW-FIX.md |
| IN-21 | info | fixed | 01-REVIEW-FIX.md |
| IN-22 | info | fixed | 01-REVIEW-FIX.md |
| WR-10 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-11 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-12 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-13 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-14 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-15 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-16 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-17 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-18 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-19 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-20 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-13 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-14 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-15 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-16 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-17 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-18 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-19 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| CR-01 | critical | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-01 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-02 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-03 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-04 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-05 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-06 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-07 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-08 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| WR-09 | warning | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-01 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-02 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-03 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-04 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-05 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-06 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-07 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-08 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-09 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-10 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |
| IN-11 | info | skipped | 01-REVIEW-FIX.md (not in the current review) |
| IN-12 | info | fixed | 01-REVIEW-FIX.md (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
