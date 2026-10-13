---
name: eli-qa-map-repos
description: Map this Bun single-repo into the QA topology manifest (.qa/qa-topology.json) for the QA runner. Detects runnable surfaces by markers (demo.ts CLI, exported tools library, check/test gates, and from Phase 3 the HTTP/SSE API, web chat and deploy), extracts start command, readiness, logs, artifacts and env var names, optionally probes a real start without code changes, and tears down what it started. On-demand only.
disable-model-invocation: true
---

Read and execute .agents/commands/eli-qa-map-repos.md.

Key rules:
- SINGLE-REPO: map surfaces of this repository (not `repos/*/*`). Surfaces promised by a later phase are recorded as `present: false` with `available_from_phase`, never probed.
- READ-ONLY toward source and `reto-01/`. Runtime output under `out/` is not source.
- Per surface: start command, port, readiness (exit-code / http / log-line / tcp), log path, artifacts, env var NAMES, depends_on, fallback.
- PROBE unless `--no-probe`: never duplicate a running surface; classify failures; ALWAYS teardown only what this command started.
- Carry forward human-edited fields and unresolved `human_requirements`.
- Write `.qa/qa-topology.json` with NO secrets. No database in this project: `db_connections: []`.
- ON-DEMAND only. Use the `codegraph` CLI for exports and routes.
- Follow EVERY step exactly — do not skip or reorder.
