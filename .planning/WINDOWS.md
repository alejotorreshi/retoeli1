---
schema_version: 1
open_count: 0
waived_count: 0
fixed_count: 1
total_count: 1
last_updated: 2026-10-12T22:49:40.868Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | src/application/generar-formulario.ts |  | generar_formulario pdf and portal arms return ERROR_INTERNO until plan 01-08 | fixed |  | 2026-10-12T22:41:13.736Z | 2026-10-12T22:49:40.868Z |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "01",
    "file": "src/application/generar-formulario.ts",
    "line": null,
    "description": "generar_formulario pdf and portal arms return ERROR_INTERNO until plan 01-08",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-10-12T22:41:13.736Z",
    "resolved_at": "2026-10-12T22:49:40.868Z",
    "milestone": null
  }
]
````
