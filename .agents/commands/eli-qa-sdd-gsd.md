<purpose>
QA runner that ENCAPSULATES GSD `verify-work` and adds an automated, human-in-the-loop verification layer —
without replacing GSD or touching its core files. Adapted from pleizi-base `eli-qa-sdd-gsd` to this single-repo
Bun project, and extended with a BATCH mode.

It builds a reusable test SUITE for the phase, proposes an automated recipe per test (CLI, exported tool call,
artifact readback, log/PII scan, determinism, and from Phase 3 HTTP/SSE and browser), asks for authorization,
runs ONLY what was authorized in a dedicated runner subagent, shows real evidence with a forensic criticality +
quality read, and the human gives the verdict: **pass / no-pass / skip**.

Default mode is **batch**: one authorization for the whole suite, one run, one verdict table where the human
confirms the agent's recommendations or overrides the exceptions. `--step` restores the original
test-by-test loop.

Evidence stays LOCAL: `{phase}-UAT.md` + a committed forensic evidence doc. Nothing goes to external tools.

SCOPE: verify-work phases ONLY. For static review use `/gsd-code-review`.
</purpose>

<inputs>
- `$ARGUMENTS`: phase number (e.g. `01`), same target as `/gsd-verify-work`.
- `.qa/qa-topology.json` (REQUIRED). If missing or stale (a surface the current phase promises is absent), STOP:
  "Run /eli-qa-map-repos first."
- GSD workflows: `~/.claude/gsd-core/workflows/verify-work.md` (session + UAT.md) and
  `~/.claude/gsd-core/workflows/diagnose-issues.md` (debugger pass).
- Phase artifacts: `*-SUMMARY.md`, `*-VERIFICATION.md` (human_verification items), `*-REVIEW-FIX.md`
  (fixes flagged "requires human verification"), `*-SECURITY.md`.
- Evidence group: `.planning/config.json` `active_tickets` if present (e.g. `PLZ-1.1-2-3`), else the phase
  directory slug (e.g. `01-n-cleo-determinista`).
</inputs>

<flags>
- `--step` — original per-test loop (authorize → run → verdict for each test).
- `--no-auto` — pure manual UAT, keeps the skip verdict.
- `--surface <name>` — bring up only this surface (and its `depends_on`).
- `--full` — at completion run diagnose → plan gaps → plan-checker fluidly, stopping only at real decisions and the
  final `/gsd-execute-phase --gaps-only` gate.
- `--only-failed` — regression-scoped re-run (see `rerun_scoping`), replaying saved recipes.
- `--text` — plain-text numbered menus instead of AskUserQuestion (nested/remote runs, #1009).
</flags>

<menus>
Use AskUserQuestion for every decision; ALWAYS keep the free-text path ("Other"). Under `--text` or nested
contexts use numbered plain-text lists.
- **Authorize (batch):** `approve all` / `approve except…` (free text names the tests) / `switch to --step` / Other.
- **Verdict (batch):** `accept recommendations` / `override` (free text: `T3 no-pass: …`) / `review flagged one by one` / Other.
- **Human-judgment items:** grouped up to 4 per AskUserQuestion call, each `pass` / `no-pass` / `skip` + Other.
- **Strategy (cascade/completion):** `Triage` / `strict` / `stop & plan` / Other.
</menus>

<process>

<step name="preflight">
1. Confirm a verify-work context; refuse code-review use.
2. Load `.qa/qa-topology.json`; stop if missing/stale.
3. `codegraph sync -q` so impact/affected reflect the current code.
4. Record which surfaces are already up (TCP on `port`) — never duplicate-start.
5. Smoke gates: run each `gate` surface (`bun run check`, `bun test`) once; a red gate is a cascade origin
   (offer Triage before building the suite).
6. Readiness and data pre-flight: detect what would make a test unverifiable for reasons unrelated to the code
   (missing optional env, absent fixture branch, a surface not present yet). Data gaps are covered with
   SYNTHETIC fixtures in a scratch copy (never by editing `reto-01/` or committed fixtures); record each as a
   deferred verification if it cannot be covered.
</step>

<step name="session_setup">
Drive GSD verify-work for session + UAT.md (respect it fully): follow `verify-work.md` through
`create_uat_file` / `resume_from_file` to produce or resume `{phase}-UAT.md`. Preserve schema and frontmatter.
Test list = verify-work's extraction from SUMMARY.md (incl. the cold-start smoke test) PLUS, de-duplicated:
- every `human_verification` item of `*-VERIFICATION.md`;
- every fix marked "requires human verification" in `*-REVIEW-FIX.md`;
- regression items from `regression_scan`.
</step>

<step name="build_suite">
Write/update `.qa/suites/{PHASE}.suite.json` (COMMITTED, reusable across runs):
```json
{
  "phase": "01",
  "generated_at": "<ISO8601>",
  "tests": [
    {
      "id": "T01",
      "uat_ref": 1,
      "name": "Cold start: demo without LLM key",
      "kind": "cli | tool | artifact | log | pii | determinism | contract | http | sse | browser | human",
      "surface": "demo-cli",
      "recipe": "exact commands / bun -e snippet / jq filter, run from a scratch copy when it mutates inputs",
      "asserts": ["machine-checkable expectations"],
      "human_checks": ["what only a person can judge"],
      "isolation": "repo | scratch-copy"
    }
  ]
}
```
Recipe kinds for this project:
- `cli`: command + asserts on exit code / stdout lines.
- `tool`: call an exported tool (`src/tools/proveedor.ts`) via `bun -e` with a `ctx.directory` pointing to a
  scratch copy; assert on the returned JSON (`ok`, `codigo`, `data` keys) — the contract is a JSON string.
- `artifact`: read back `out/<caso>/formulario.xlsx` cells with exceljs, PDF text/page count, `paquete/` listing,
  `checklist.md`, `borrador-correo.md`, `ENVIO-SIMULADO.md`.
- `log`: `jq` over `out/log.jsonl` and `out/<caso>/log.jsonl` (fields, one line per call, no raw args).
- `pii`: scan responses, stdout, logs and outputs for sensitive maestro values (positive control required).
- `determinism`: run twice (and from a second root) and diff, ignoring documented volatile fields.
- `contract`: `z.toJSONSchema` of each tool's args + descriptions vs the locked contract.
- `http` / `sse` (Phase 3+): `curl` / `curl -N` against the surface port; `browser`: Playwright-MCP.
- `human`: no automation; evidence is prepared (rendered thumbnails via `qlmanage -t` on macOS, file paths) for a
  person to judge look, tone or a product decision.
A test whose recipe mutates inputs (editing `reglas.json`, blanking a maestro value) MUST run in a scratch copy
under the session scratchpad or `$TMPDIR` — never in the repo.
</step>

<step name="evidence_doc_init">
Layout (create up front):
```
.qa/evidence/{GROUP}/
├── {PHASE}-QA-EVIDENCE-{timestamp}.md   # COMMITTED forensic record
├── seeds/{PHASE}-{slug}.*               # COMMITTED synthetic data / fixtures used by recipes
└── screenshots/{PHASE}-test{NN}-{slug}.png  # gitignored, local only
```
One run = one doc (timestamp with `:`→`-`), never overwritten. Sanitize: no maestro PII values, no secrets —
reference sensitive values by field path and masked form only. Header: phase, group, surfaces, topology snapshot,
gates result, regression-scan result, suite file + hash, started ts.
Per-test block:
```
### TNN — {name}
- expected:
- recipe:
- command / request sent (sanitized):
- raw result (status, capped output):
- artifacts read:
- log slice:
- timing:
- forensic criticality:
- quality opinion (agent):
- agent recommendation: pass | no-pass | pass-partial (+follow-up) | needs-human
- verdict (human): pass | no-pass | skip (decided-by, ts)
- gap_ref:
```
</step>

<step name="regression_scan">
```bash
git diff --name-only <phase-base>..HEAD | codegraph affected --stdin -q
```
plus `codegraph impact <symbol>` for shared symbols the phase touched. Prior-phase risk → add a regression item.
Record the result in the evidence header.
</step>

<step name="batch_loop">
Default mode (skip when `--step`).
1. **Present the plan** as one table: test id, name, kind, automated asserts (short), human checks, isolation.
2. **Authorize once** (Authorize batch menu). Excluded tests become `manual` or `skipped` as the human says.
3. **Bring up surfaces** the authorized tests need (fallback ladder: auto → retry env → human-assisted → skip with
   `blocked_by: service`). Orchestrator owns lifecycle.
4. **Run** the authorized recipes in the `eli-qa-runner` subagent (one runner for the batch, or one per
   independent group when that is faster). The runner writes every per-test block and returns a compact table.
5. **Cascade check:** if several failures share one root cause, offer Triage before the verdict.
6. **Verdict:** show the result table (id, asserts passed/failed, recommendation, criticality). Human uses the
   Verdict batch menu; `needs-human` items are then asked in grouped AskUserQuestion calls with their evidence
   (paths, thumbnails, excerpts).
7. **Record** into UAT.md with verify-work semantics: pass → `pass`; no-pass → `issue` + inferred severity +
   `## Gaps` entry; skip → `skipped` + reason (+`blocked_by`). Finalize each verdict line in the evidence doc.
8. **Save recipes** that worked back into the suite file so re-runs replay them.
</step>

<step name="step_loop">
Only with `--step`: the original loop per pending test — present expected → propose recipe + human checks →
Authorize (approve / manual / skip / Other) → bring up surfaces → runner executes → show evidence → Verdict →
record → in-run strengthening (ask before adding missing data) → save recipe.
</step>

<step name="completion">
1. Teardown: stop ONLY surfaces this run started; keep `.qa/logs/*.log`.
2. Hygiene: no stray PNGs outside `screenshots/`, clear `.playwright-mcp/` contents, scratch copies removed,
   `git status --porcelain` shows only the evidence doc, suite file and seeds as new committed QA files
   (plus UAT.md). `out/` is runtime output (gitignored).
3. Finalize the evidence doc with a run summary (counts, strategy, surfaces started, regression flags, deferred items).
4. Commit `{phase}-UAT.md`, the evidence doc, the suite file and seeds (Conventional Commit `test({phase}): ...`).
5. Diagnosis DEFAULT-ON when issues exist: `diagnose-issues.md` → one `gsd-debugger` per distinct issue
   (cascade duplicates share one), adversarial when a live diagnosis exists; always for blocker/major, offered
   for minor/cosmetic.
6. Fluidity: without `--full`, present the summary + recommended next command and ask. With `--full`, run the tail
   fluidly up to the final `/gsd-execute-phase --gaps-only` gate (always the human's).
7. All pass and no open human items → follow verify-work's security gate + transition (phase completion).
</step>

<step name="rerun_scoping">
Re-run set = (failed ∪ blocked ∪ deferred) ∪ (tests whose code the fix diff touches):
```bash
git diff --name-only <pre-fix>..HEAD | codegraph affected --stdin -q
```
Replay the saved recipes from `.qa/suites/{PHASE}.suite.json`; record the computed set and why each test is in it.
</step>

</process>

<runner_subagent_contract>
`eli-qa-runner` — this command's own execution + evidence subagent (not a GSD agent).
- Task: run ONLY the authorized recipes, verbatim. Never start/stop surfaces, never modify `src/`, `tests/`,
  `web/`, `reto-01/` or committed fixtures. Mutating recipes run in a scratch copy.
- Inputs: suite file path + authorized test ids, surface base URL/port when relevant, log paths + time window,
  ABSOLUTE evidence-doc path, ABSOLUTE screenshots dir, phase number, scratch dir.
- Do: execute, capture raw results, read artifacts, slice logs, sanitize (no maestro PII values), write each
  per-test block, give forensic criticality + honest quality opinion + recommendation
  (pass / no-pass / pass-partial / needs-human).
- Screenshots and thumbnails: explicit path `.../screenshots/{PHASE}-test{NN}-{slug}.png`, never a bare filename.
- Return: a compact table + the few lines that matter per failure. Not the raw dump.
- Must not: ask the human anything, manage surface lifecycle, commit, or relabel grep/Read as codegraph-confirmed.
</runner_subagent_contract>

<critical_rules>
- verify-work ONLY; drive verify-work.md and keep the UAT.md schema and downstream flow intact.
- Authorize before execute (once per batch, or per test with `--step`).
- The human always gives the verdict with evidence in front of them; menus keep a free-text path.
- Execution in the runner subagent; human interaction and surface lifecycle in the orchestrator.
- Never modify source, tests, `reto-01/` or committed fixtures; mutating probes use scratch copies.
- Committed, sanitized evidence doc per run; screenshots gitignored; suite file committed and replayable.
- Diagnosis default-on, severity-gated; full tail only with `--full`; final execute gate always human.
- Re-runs regression-scoped with codegraph, replaying saved recipes.
- Manifest-driven: no hardcoded start commands or ports outside `.qa/qa-topology.json`.
- Evidence local only.
</critical_rules>

<success_criteria>
- [ ] Refuses code-review use; requires `.qa/qa-topology.json`
- [ ] verify-work drives UAT.md; suite includes SUMMARY tests + VERIFICATION human items + REVIEW-FIX human items + regressions
- [ ] Gates smoke-run; pre-flight gaps surfaced; mutating recipes isolated in scratch copies
- [ ] `.qa/suites/{PHASE}.suite.json` written and committed
- [ ] Batch plan presented and authorized once (or per test with `--step`)
- [ ] Runner executed authorized recipes; evidence doc complete and sanitized
- [ ] Verdict table resolved by the human; UAT.md mapping correct; gaps appended
- [ ] Cascades triaged; teardown and hygiene done; QA files committed
- [ ] Diagnosis default-on when issues exist; next step or phase transition presented
</success_criteria>
