import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { capturarLogs } from "@tests/helpers/bitacora.helper.ts";
import { recoger, sesionDe } from "@tests/helpers/eventos.helper.ts";
import { cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { proyectarMapeo } from "@tests/helpers/flujo.helper.ts";
import { extraerTrazos } from "@tests/helpers/pdf-texto.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { leerCeldasXlsx } from "@tests/helpers/xlsx-leer.helper.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";

export const CLAVE_QA = "clave-falsa-qa-K7mPq";
export const RAIZ = process.cwd();
export const N = NOMBRE_VISIBLE;
export const H = HERRAMIENTA;

pinExecutionDate(FECHA_DEMO);

export type Cuerpo = {
  model: string;
  thinking?: { type: string };
  messages: { role: string; content: string; tool_call_id?: string; tool_calls?: { id: string; function: { name: string; arguments: string } }[] }[];
  tools?: { function: { name: string } }[];
};
export type Pedido = { url: string; cabeceras: Record<string, string>; texto: string; cuerpo: Cuerpo };
export type Paso =
  | { estado?: number; cuerpo: unknown; colgar?: boolean; red?: boolean }
  | ((cuerpo: Cuerpo) => { estado?: number; cuerpo: unknown });

export function guionFetch(pasos: readonly Paso[]) {
  const pedidos: Pedido[] = [];
  let i = 0;
  const fetch: FetchLike = async (url, init) => {
    const texto = String(init.body);
    const cuerpo: Cuerpo = JSON.parse(texto);
    pedidos.push({ url, cabeceras: Object.fromEntries(new Headers(init.headers)), texto, cuerpo });
    const paso = pasos[i];
    i += 1;
    if (paso === undefined) throw new Error("guion agotado");
    const r = typeof paso === "function" ? paso(cuerpo) : paso;
    if ("red" in r && r.red === true) throw new TypeError("fetch failed: ECONNRESET");
    if ("colgar" in r && r.colgar === true) {
      return new Promise<Response>((_, rechazar) => {
        const abortar = () => rechazar(new DOMException("abortado", "AbortError"));
        if (init.signal?.aborted) abortar();
        else init.signal?.addEventListener("abort", abortar, { once: true });
      });
    }
    const body = typeof r.cuerpo === "string" ? r.cuerpo : JSON.stringify(r.cuerpo);
    return new Response(body, { status: r.estado ?? 200, headers: { "Content-Type": "application/json" } });
  };
  return { fetch, pedidos, consumidos: () => i };
}

export const herr = (nombre: string, argumentos: unknown, id: string): Paso => ({
  cuerpo: cuerpoConHerramientas({ nombre, argumentos, id }),
});
export const texto = (t: string): Paso => ({ cuerpo: cuerpoConTexto(t) });

export function generarConMapeo(caso: string, id = `generar-${caso}`): Paso {
  return (cuerpo) => {
    const ids = new Set(
      cuerpo.messages.flatMap((m) =>
        (m.tool_calls ?? []).filter((c) => c.function.name === N[H.MAPEAR_CAMPOS]).map((c) => c.id),
      ),
    );
    const res = cuerpo.messages.filter((m) => m.role === "tool" && ids.has(m.tool_call_id ?? "")).at(-1);
    if (res === undefined) throw new Error("sin resultado de mapear");
    const mapeo = proyectarMapeo(JSON.parse(res.content));
    return { cuerpo: cuerpoConHerramientas({ nombre: N[H.GENERAR_FORMULARIO], argumentos: { caso, mapeo }, id }) };
  };
}

export function flujoCaso(caso: string, sufijo = "1"): Paso[] {
  return [
    herr(N[H.LEER_SOLICITUD], { caso }, `leer-${caso}-${sufijo}`),
    herr(N[H.MAPEAR_CAMPOS], { caso, campos: [] }, `mapear-${caso}-${sufijo}`),
    generarConMapeo(caso, `generar-${caso}-${sufijo}`),
    herr(N[H.ARMAR_PAQUETE], { caso }, `armar-${caso}-${sufijo}`),
  ];
}

export function agenteQa(fetch: FetchLike, entorno: Record<string, string> = {}, conLogs = false) {
  const esperas: number[] = [];
  const captura = capturarLogs();
  const creacion = crearAgente({
    directorio: RAIZ,
    fetch,
    fuenteEntorno: { LLM_API_KEY: CLAVE_QA, LOG_LEVEL: "silent", ...entorno },
    esperar: async (ms) => {
      esperas.push(ms);
    },
    ...(conLogs ? { destinoLogs: captura.destino } : {}),
  });
  if (!creacion.ok) throw new Error(creacion.mensaje);
  let sesionId: string | null = null;
  return {
    agente: creacion.agente,
    esperas,
    captura,
    async turno(mensaje: string): Promise<EventoAgente[]> {
      const ev = await recoger(creacion.agente.turno({ sesionId, mensaje }));
      sesionId = sesionDe(ev);
      return ev;
    },
  };
}

export async function textoDeSalidas(caso: string): Promise<string> {
  const dir = join(RAIZ, "out", caso);
  if (!existsSync(dir)) return "";
  const partes: string[] = [];
  for (const nombre of await readdir(dir)) {
    const ruta = join(dir, nombre);
    if (nombre.endsWith(".xlsx")) {
      partes.push((await leerCeldasXlsx(ruta)).map((c) => String(c.valor)).join("\n"));
    } else if (nombre.endsWith(".pdf")) {
      partes.push((await extraerTrazos(new Uint8Array(await readFile(ruta)))).map((t) => t.texto).join("\n"));
    } else if (nombre.endsWith(".md") || nombre.endsWith(".json")) {
      partes.push(await readFile(ruta, "utf8"));
    }
  }
  return partes.join("\n");
}

export async function escaneoPii(caso: string, corpus: string) {
  const sensibles = await sensiblesDelProyecto(RAIZ);
  const salida = await textoDeSalidas(caso);
  const controlPositivo = sensibles.filter((s) => salida.includes(s.valor)).map((s) => s.ruta);
  const filtrados = sensibles.filter((s) => corpus.includes(s.valor)).map((s) => s.ruta);
  return { totalSensibles: sensibles.length, controlPositivo: [...new Set(controlPositivo)], filtrados: [...new Set(filtrados)] };
}

export async function listar(rel: string): Promise<string[]> {
  const dir = join(RAIZ, rel);
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile()) out.push(join(e.parentPath ?? "", e.name).replace(`${dir}/`, ""));
  }
  return out.sort();
}

export function ultimoParrafo(t: string): string {
  return t.trimEnd().split("\n\n").at(-1) ?? "";
}

export const resultados: { assert: string; ok: boolean; detalle?: unknown }[] = [];
export function chequear(assert: string, ok: boolean, detalle?: unknown) {
  resultados.push({ assert, ok, detalle });
}
export function informe(id: string, extra: Record<string, unknown> = {}) {
  const pasados = resultados.filter((r) => r.ok).length;
  console.log(JSON.stringify({ id, pasados, total: resultados.length, resultados, ...extra }, null, 1));
}
