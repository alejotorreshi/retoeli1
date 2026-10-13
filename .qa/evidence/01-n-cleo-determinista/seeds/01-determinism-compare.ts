import ExcelJS from "exceljs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
const [base, ...others] = process.argv.slice(2);
const files = (await readFile(join(base, "..", "files-run1.txt"), "utf8")).trim().split("\n");
async function xlsxSig(p: string) {
  const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(p);
  const out: string[] = [];
  wb.eachSheet((ws) => ws.eachRow({ includeEmpty: false }, (row) => row.eachCell({ includeEmpty: false }, (c) => {
    out.push(JSON.stringify([ws.name, c.address, c.value, c.font?.bold ?? null, c.fill ?? null, c.note ?? null]));
  })));
  return out.join("\n");
}
async function sig(p: string) {
  if (p.endsWith(".xlsx")) return xlsxSig(p);
  const t = await readFile(p);
  if (p.endsWith(".jsonl")) return t.toString("utf8").trim().split("\n").map((l) => { const o = JSON.parse(l); delete o.ts; return JSON.stringify(o); }).join("\n");
  return t.toString("base64");
}
let diffs = 0;
for (const f of files) {
  const a = await sig(join(base, f));
  for (const o of others) { if (a !== (await sig(join(o, f)))) { diffs++; console.log("DIFF", o, f); } }
}
console.log(`compared ${files.length} files x ${others.length} runs, semantic diffs=${diffs}`);
