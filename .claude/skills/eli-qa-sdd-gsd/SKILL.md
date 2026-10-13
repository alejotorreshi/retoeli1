---
name: eli-qa-sdd-gsd
description: QA runner that wraps GSD verify-work with an automated, human-in-the-loop layer for this Bun single-repo. Builds a replayable phase suite (.qa/suites), proposes recipes per UAT test (CLI, exported tool call, xlsx/pdf/md artifact readback, jsonl logs, PII scan, determinism, and HTTP/SSE/browser from Phase 3), runs them in a runner subagent after ONE batch authorization (or per test with --step), shows evidence, and the human gives pass/no-pass/skip. verify-work phases only.
argument-hint: "[phase, e.g. '01'] [--step] [--no-auto] [--surface <name>] [--full] [--only-failed] [--text]"
disable-model-invocation: true
---

Read and execute .agents/commands/eli-qa-sdd-gsd.md.

Key rules:
- SCOPE: wraps GSD verify-work ONLY, never code-review. Drive `~/.claude/gsd-core/workflows/verify-work.md`; keep the UAT.md schema and the diagnosis/gap flow.
- REQUIRES `.qa/qa-topology.json` (from /eli-qa-map-repos). Never hardcode start commands or ports.
- DEFAULT BATCH: present the whole suite plan, authorize once, run all authorized recipes in the `eli-qa-runner` subagent, show one verdict table; the human accepts the recommendations or overrides exceptions. `--step` restores the per-test loop.
- SUITE: `.qa/suites/{PHASE}.suite.json` is committed and replayable; tests come from SUMMARY + VERIFICATION human items + REVIEW-FIX human items + regressions.
- NEVER modify `src/`, `tests/`, `web/`, `reto-01/` or committed fixtures; recipes that mutate inputs run in a scratch copy.
- VERDICTS: pass / no-pass / skip, always by the human with evidence shown; menus keep a free-text path, plain text under `--text`.
- EVIDENCE: committed, sanitized `.qa/evidence/{GROUP}/{PHASE}-QA-EVIDENCE-{ts}.md` (no maestro PII values, no secrets); screenshots gitignored under `screenshots/`.
- CASCADE triage, diagnosis default-on (gsd-debugger, severity-gated), full tail only with `--full`, final execute gate always human.
- RE-RUNS regression-scoped with `codegraph affected`, replaying saved recipes.
- Use the codegraph CLI, not blind grep, for impact. Evidence stays local.
- Follow EVERY step exactly — do not skip or reorder.
