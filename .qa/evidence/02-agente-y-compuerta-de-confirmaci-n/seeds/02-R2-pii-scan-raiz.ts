import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { ejecutarDemo } from "@/demo/runners/ejecutar-demo.runner.ts";
import { simular_envio } from "@/tools/proveedor.ts";
import { extraerTrazos } from "@tests/helpers/pdf-texto.helper.ts";
const ROOT = process.cwd();
const responses: { origen: string; texto: string }[] = [];
const stdout: string[] = [];
await ejecutarDemo({ directorio: ROOT, escribir: (l) => stdout.push(l), observar: (h, r) => responses.push({ origen: "resp:" + h, texto: r }) });
process.env.FECHA_EJECUCION = "2026-09-03";
for (const caso of ["ec-corp-andina", "hn-agroexport-sula"]) responses.push({ origen: "resp:simular_envio(confirmado)", texto: await simular_envio.execute({ caso, confirmado: true }, { directory: ROOT, sessionId: "qa" }) });
delete process.env.FECHA_EJECUCION;
const maestro = JSON.parse(await readFile(join(ROOT, "reto-01/fixtures/reto-01/repositorio/maestro.json"), "utf8"));
const SENS = ["nit","direccion","codigo_postal","telefono","matricula_mercantil","fecha_constitucion","representante_legal.nombre","representante_legal.identificacion","representante_legal.email","contacto_comercial.nombre","contacto_comercial.email","contacto_comercial.telefono","contacto_financiero.nombre","contacto_financiero.email","contacto_financiero.telefono","banco.numero_cuenta","banco.swift","ingresos_ultimo_ano.valor"];
const get = (p: string) => p.split(".").reduce((o: any, k) => o?.[k], maestro);
const needles: { ruta: string; v: string }[] = [];
for (const ruta of SENS) { const v = get(ruta); if (v === undefined || v === null) continue; const s = String(v); needles.push({ ruta, v: s });
  if (ruta === "ingresos_ultimo_ano.valor") { for (const f of [new Intl.NumberFormat("es-CO").format(v), new Intl.NumberFormat("en-US").format(v)]) needles.push({ ruta: ruta + "(fmt)", v: f }); }
  if (/telefono/.test(ruta)) needles.push({ ruta: ruta + "(digits)", v: s.replace(/\D/g, "") });
}
const mask = (s: string) => "••••" + s.slice(-4).replace(/@.*/, "@…");
async function walk(d: string): Promise<string[]> { const out: string[] = []; for (const e of await readdir(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) out.push(...await walk(p)); else out.push(p); } return out; }
const files = (await walk(join(ROOT, "out"))).map((p) => p.slice(ROOT.length + 1)).sort();
const corpus: { origen: string; texto: string }[] = [...responses, ...stdout.map((t) => ({ origen: "stdout", texto: t }))];
for (const f of files) {
  const abs = join(ROOT, f);
  if (f.endsWith(".xlsx")) { const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(abs); const vals: string[] = []; wb.eachSheet((ws) => ws.eachRow((r) => r.eachCell((c) => vals.push(String(c.value ?? ""))))); corpus.push({ origen: f, texto: vals.join("\n") }); }
  else if (f.endsWith(".pdf")) corpus.push({ origen: f, texto: (await extraerTrazos(new Uint8Array(await readFile(abs)))).map((t) => t.texto).join("\n") });
  else corpus.push({ origen: f, texto: await readFile(abs, "utf8") });
}
const isForm = (o: string) => /formulario\.(xlsx|pdf)$|valores-portal\.md$/.test(o);
const hits: Record<string, Set<string>> = {}; const ctrl: Record<string, Set<string>> = {};
for (const { origen, texto } of corpus) for (const n of needles) if (n.v.length >= 5 && texto.includes(n.v)) (isForm(origen) ? ctrl : hits)[origen] ??= new Set(), (isForm(origen) ? ctrl : hits)[origen].add(n.ruta + " " + mask(n.v));
console.log("corpus items:", corpus.length, "responses:", responses.length, "stdout lines:", stdout.length, "files:", files.length, "needles:", needles.filter((n) => n.v.length >= 5).length);
console.log("ENVIO files:", files.filter((f) => f.endsWith("ENVIO-SIMULADO.md")));
console.log("HITS outside forms:"); for (const [o, s] of Object.entries(hits)) console.log("  ", o, "->", [...s].join(", "));
console.log("POSITIVE CONTROL (forms):"); for (const [o, s] of Object.entries(ctrl)) console.log("  ", o, "->", s.size, "distinct sensitive paths");
