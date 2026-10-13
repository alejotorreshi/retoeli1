<purpose>
Map THIS repository (single-repo, Bun) into a QA topology manifest that the QA runner (`eli-qa-sdd-gsd`)
consumes to start runnable surfaces, verify behavior and reconcile artifacts. Adapted from the pleizi-base
`eli-qa-map-repos` (multi-repo, `repos/*/*`) to a single project whose evidence lives in generated files
(`out/`), logs (`jsonl`) and, from Phase 3 on, an HTTP/SSE API and a web chat.

Writes `.qa/qa-topology.json` (NO secrets, committed). There is no database in this project, so there is
no `dbhub.toml`; `db_connections` stays `[]` until a phase introduces one.

READ-ONLY toward source code: never edits `src/`, `tests/`, `web/`, `reto-01/`. ON-DEMAND only: never wired
into session start. Re-run it when a phase adds a runnable surface (e.g. `bun run dev` in Phase 3).
</purpose>

<inputs>
- `package.json` scripts, `bun.lock`, `.bun-version`, `tsconfig.json`.
- `src/config/env.ts` (env var NAMES only, never values) and `.env.example` if present.
- `.planning/ROADMAP.md` (which surfaces each phase promises) and `.planning/STATE.md` (current phase).
- `reto-01/PRD.md` §6.4 (API), §6.6 (`demo.ts`), §8 (one-command start).
- Existing `.qa/qa-topology.json`: carry forward human-edited fields and unresolved `human_requirements`.
</inputs>

<flags>
- `--no-probe` — static analysis only.
- `--probe` — also probe surfaces marked `fallback: human` (never starts what is already up).
- `--surface <name>` — limit mapping/probe to one surface.
Default: static analysis for all, probe only surfaces whose `fallback` resolves to `auto`.
</flags>

<process>

<step name="detect_surfaces">
Detect runnable surfaces by MARKERS (extensible registry; never invent a command):

| Marker | kind | start | readiness | evidence |
|---|---|---|---|---|
| root `demo.ts` + script `demo` | `cli` | `bun run demo.ts` | `exit-code` 0 within `timeout_s` | stdout, `out/**`, `out/**/log.jsonl` |
| `src/tools/proveedor.ts` | `library` | none (imported by recipes via `bun -e` from a scratch copy) | n/a | JSON string returned per tool |
| script `check` / `test` | `gate` | `bun run check`, `bun test` | `exit-code` 0 | summary line |
| script `dev` with `src/server*` (Hono/Bun.serve) | `http` | `bun run dev` | `http` GET `/api/health` 200 | HTTP/SSE responses, server stdout |
| `web/` with Vite config | `web` | served by `dev` (proxy) or `vite` | `http` 200 on `/` | browser snapshot via Playwright-MCP |
| `Dockerfile` / `render.yaml` | `deploy` | none locally (`fallback: human`) | `http` on the public URL | `curl -N` against the deployed URL |

Rules:
- A surface the ROADMAP promises for a later phase but that does not exist yet is recorded with
  `present: false` and `available_from_phase: N`. It is never probed.
- Unknown or ambiguous surfaces → `fallback: "human"`, start null.
</step>

<step name="extract_runtime">
Per surface record: `start.cmd`, `start.cwd`, `port` (from `PORT`/config, else null), `readiness`
(`exit-code` | `http` url | `log-line` pattern | `tcp`, with `timeout_s`), `logs.path` (`.qa/logs/<name>.log`),
`artifacts` (globs the surface writes), `env.required` / `env.optional` (NAMES only, from `src/config/env.ts`),
`depends_on`, `fallback` (`auto` | `human` | `skip`), `in_local_qa_scope`.
Also record `runtime.bun` (from `.bun-version` and `bun --version`) and flag a mismatch.
Use the `codegraph` CLI (not blind grep) to list the exported tools of `src/tools/proveedor.ts` and, from
Phase 3 on, the HTTP routes.
</step>

<step name="probe_start">
Skip if `--no-probe`. For each `auto` surface:
1. `http`/`web`: TCP-check the port first; if listening, `probe.result: "up"` and do NOT start a duplicate.
2. Start without changing code, redirecting output: `mkdir -p .qa/logs && ( <start.cmd> ) > .qa/logs/<name>.log 2>&1 &`.
   For `cli`/`gate`, run in the foreground bounded by `timeout_s`.
3. Classify: `up` | `missing_env` (capture the log lines, fill `env.missing` + `human_requirements`) | `start_failed` (log tail).
4. TEARDOWN: kill ONLY processes this step started. `out/` written by a probe is runtime output (gitignored), never source.
</step>

<step name="write_manifest">
Write `.qa/qa-topology.json`:
```json
{
  "generated_at": "<ISO8601>",
  "project": "reto-eli-1",
  "runtime": { "bun_pinned": "1.4.3", "bun_local": "1.4.3" },
  "surfaces": [
    {
      "name": "demo-cli",
      "kind": "cli",
      "present": true,
      "start": { "cmd": "bun run demo.ts", "cwd": "." },
      "port": null,
      "readiness": { "kind": "exit-code", "expect": 0, "timeout_s": 120 },
      "logs": { "path": ".qa/logs/demo-cli.log" },
      "artifacts": ["out/**"],
      "env": { "required": [], "optional": ["FECHA_EJECUCION"], "missing": [] },
      "depends_on": [],
      "probe": { "result": "up", "detail": "", "checked_at": "<ISO8601>" },
      "fallback": "auto",
      "in_local_qa_scope": true,
      "human_requirements": []
    }
  ],
  "db_connections": []
}
```
No secrets, ever. The file is committed.
</step>

<step name="present_summary">
```
### eli-qa-map-repos — QA topology

{N} surfaces · {auto} auto · {human} need human · {future} not yet present
{per surface:} {name} [{kind}] {start.cmd} readiness:{kind} probe:{result}
{if human_requirements:} ⚠ needs: {requirement}
```
</step>

</process>

<critical_rules>
- READ-ONLY toward source and toward `reto-01/`.
- NO SECRETS in the manifest — env var NAMES only.
- Probe teardown is mandatory; never kill what was already running.
- ON-DEMAND only.
- Use the `codegraph` CLI for exports/routes; never relabel a grep as codegraph-confirmed.
</critical_rules>

<success_criteria>
- [ ] Every runnable surface detected (present now or promised later), unknowns marked `human`
- [ ] Runtime facts extracted; Bun pin vs local compared
- [ ] Probe run (unless `--no-probe`), classified, torn down
- [ ] Human fields and unresolved requirements carried forward
- [ ] `.qa/qa-topology.json` written without secrets; summary shown
</success_criteria>
