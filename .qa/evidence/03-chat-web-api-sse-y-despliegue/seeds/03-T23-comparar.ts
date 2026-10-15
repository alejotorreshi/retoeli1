import { tomarInstantanea } from "@tests/helpers/instantanea.helper.ts";
import { deepEquals } from "bun";
const [a, b] = process.argv.slice(2);
const ia = await tomarInstantanea(a ?? ""); const ib = await tomarInstantanea(b ?? "");
const ka = [...ia.keys()]; const kb = [...ib.keys()];
console.log("files", ka.length, kb.length, "same paths", JSON.stringify(ka) === JSON.stringify(kb));
let diff = 0;
for (const k of ka) if (!deepEquals(ia.get(k), ib.get(k))) { diff++; console.log("DIFF", k); }
console.log("differing after ignoring volatile (jsonl ts, xlsx zip metadata):", diff);
