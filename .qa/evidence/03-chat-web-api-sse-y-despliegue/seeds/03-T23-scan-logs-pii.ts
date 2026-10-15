import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
const root = process.argv[2] ?? "";
const s = await sensiblesDelProyecto(process.cwd());
const logs = (await readdir(join(root, "out"), { recursive: true })).filter((f) => f.endsWith("log.jsonl")).map((f) => join(root, "out", f));
const ctrlDir = join(root, ".qa-ctrl"); await mkdir(ctrlDir, { recursive: true });
const ctrl = join(ctrlDir, "control-positivo.jsonl");
const sample = s.find((x) => x.valor.length >= 5);
await writeFile(ctrl, JSON.stringify({ evento: "control", valor: sample?.valor ?? "" }) + "\n");
const scan = async (files: string[]) => { let hits = 0; for (const f of files) { const t = await readFile(f, "utf8"); for (const x of s) if (x.valor.length >= 5 && t.includes(x.valor)) { hits++; console.log("HIT", f.slice(root.length + 1), x.ruta); } } return hits; };
const realHits = await scan(logs);
const ctrlHits = await scan([ctrl]);
let rawArgs = 0, stacks = 0, lines = 0;
for (const f of logs) for (const l of (await readFile(f, "utf8")).split("\n").filter(Boolean)) { lines++; const o = JSON.parse(l); if ("args" in o || "argumentos" in o) rawArgs++; if (JSON.stringify(o).includes("    at ")) stacks++; }
console.log("sensibles", s.length, "log files", logs.length, "log lines", lines, "hits", realHits, "positive control hits", ctrlHits, "lines with raw args", rawArgs, "lines with stack", stacks);
