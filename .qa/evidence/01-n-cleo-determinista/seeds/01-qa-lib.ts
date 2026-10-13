import * as P from "@/tools/proveedor.ts";
type Tools = typeof P;
export const ctx = { directory: process.cwd(), sessionId: "qa" };
export async function call(name: keyof Tools, args: unknown): Promise<Record<string, any>> {
  const raw = await (P[name] as { execute: (a: unknown, c: unknown) => Promise<string> }).execute(args, ctx);
  return JSON.parse(raw);
}
export function proyectar(m: Record<string, any>) {
  return ["llenos", "faltantes", "requiere_confirmacion"].flatMap((g) => Array.isArray(m.data?.[g]) ? m.data[g] : []).map((i: any) => ({ etiqueta: i.etiqueta, estado: i.estado, ruta: i.ruta }));
}
import { extraerTrazos } from "@tests/helpers/pdf-texto.helper.ts";
export async function pdfTrazos(p: string) { return extraerTrazos(new Uint8Array(await Bun.file(p).arrayBuffer())); }
