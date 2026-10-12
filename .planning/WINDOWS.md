---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-10-12T22:41:13.736Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | src/application/generar-formulario.ts |  | generar_formulario pdf and portal arms return ERROR_INTERNO until plan 01-08 | open |  | 2026-10-12T22:41:13.736Z |  |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "01",
    "file": "src/application/generar-formulario.ts",
    "line": null,
    "description": "generar_formulario pdf and portal arms return ERROR_INTERNO until plan 01-08",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-12T22:41:13.736Z",
    "resolved_at": null,
    "milestone": null
  }
]
````
