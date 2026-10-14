import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
const dir = process.argv[2] ?? "";
const s = await sensiblesDelProyecto(process.cwd());
let hits = 0;
for (const f of await readdir(dir)) { const t = await readFile(join(dir, f), "utf8"); for (const x of s) if (x.valor.length >= 5 && t.includes(x.valor)) { hits++; console.log("HIT", f, x.ruta); } }
console.log("sensibles", s.length, "hits", hits);
