import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import {
  casosConEnvioSimulado,
  confirmaciones,
  finDeTurno,
  finesDeHerramienta,
  recoger,
  sesionDe,
  textos,
} from "@tests/helpers/eventos.helper.ts";
import { proyectarMapeo } from "@tests/helpers/flujo.helper.ts";
import type { CuerpoPedido } from "@tests/helpers/types/fetch-falso.type.ts";
import { FIXTURES_DIR, OUT_DIR } from "@/config/constants/files.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import type { ConfirmacionEstructurada } from "@/loop/types/turno.type.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";

export const EC = "ec-corp-andina";
export const CO = "co-industrias-delta";
export const CLAVE = "clave-falsa-qa";
const RAIZ_SCRATCH = join(import.meta.dir, "..");
const RUNS = join(import.meta.dir, "..", "..", "runs");

type Paso = unknown | ((cuerpo: CuerpoPedido) => unknown);

export async function proyecto(id: string): Promise<string> {
  const raiz = join(RUNS, id);
  await rm(raiz, { recursive: true, force: true });
  await mkdir(raiz, { recursive: true });
  await cp(join(RAIZ_SCRATCH, FIXTURES_DIR), join(raiz, FIXTURES_DIR), { recursive: true });
  await writeFile(join(raiz, "package.json"), '{ "name": "qa-r2", "private": true }\n');
  return raiz;
}

export function herr(id: string, h: keyof typeof HERRAMIENTA, args: unknown): unknown {
  return cuerpoConHerramientas({ id, nombre: NOMBRE_VISIBLE[HERRAMIENTA[h]], argumentos: args });
}

export function texto(t: string): unknown {
  return cuerpoConTexto(t);
}

export function generar(caso: string, mapearId = `mapear-${caso}`): Paso {
  return (cuerpo: CuerpoPedido) => {
    const msg = [...cuerpo.messages].reverse().find((m) => m.role === "tool" && m.tool_call_id === mapearId);
    if (msg === undefined) throw new Error(`sin resultado de ${mapearId}`);
    const mapeo = proyectarMapeo(JSON.parse(msg.content));
    return herr(`generar-${caso}`, "GENERAR_FORMULARIO", { caso, mapeo });
  };
}

export function armar(caso: string, cierre = `Armé el paquete de ${caso}.`): Paso[] {
  return [
    herr(`mapear-${caso}`, "MAPEAR_CAMPOS", { caso, campos: [] }),
    generar(caso),
    herr(`armar-${caso}`, "ARMAR_PAQUETE", { caso }),
    texto(cierre),
  ];
}

export function enviar(id: string, caso: string, cierre = "Listo."): Paso[] {
  return [herr(id, "SIMULAR_ENVIO", { caso }), texto(cierre)];
}

export function fetchDinamico(pasos: readonly Paso[]) {
  const pedidos: CuerpoPedido[] = [];
  const fetch: FetchLike = async (_url, init) => {
    const cuerpo: CuerpoPedido = JSON.parse(String(init.body));
    pedidos.push(cuerpo);
    const paso = pasos[pedidos.length - 1];
    if (paso === undefined) throw new Error("guion agotado");
    const salida = typeof paso === "function" ? paso(cuerpo) : paso;
    return new Response(JSON.stringify(salida), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  return { fetch, pedidos };
}

export function agente(raiz: string, pasos: readonly Paso[], entorno: Record<string, string> = {}) {
  const f = fetchDinamico(pasos);
  const creacion = crearAgente({
    directorio: raiz,
    fetch: f.fetch,
    fuenteEntorno: { LLM_API_KEY: CLAVE, LOG_LEVEL: "silent", ...entorno },
    esperar: async () => {},
  });
  if (!creacion.ok) throw new Error(creacion.mensaje);
  let sesionId: string | null = null;
  return {
    pedidos: f.pedidos,
    async turno(mensaje: string, extra: { signal?: AbortSignal; confirmacion?: ConfirmacionEstructurada } = {}) {
      const eventos = await recoger(creacion.agente.turno({ ...extra, sesionId, mensaje }));
      sesionId = sesionDe(eventos);
      return eventos;
    },
    async turnoAbortado(mensaje: string) {
      const c = new AbortController();
      const eventos: EventoAgente[] = [];
      for await (const e of creacion.agente.turno({ sesionId, mensaje, signal: c.signal })) {
        eventos.push(e);
        if (e.tipo === "turn_start" || e.tipo === "inicio_turno") c.abort();
        if (eventos.length === 1) c.abort();
      }
      return eventos;
    },
  };
}

export function ultimoParrafo(t: string): string {
  return t.trimEnd().split("\n\n").at(-1) ?? "";
}

export function textoFinalSeguro(eventos: readonly EventoAgente[]): string {
  return textos(eventos).at(-1)?.texto ?? "";
}

export function resumen(eventos: readonly EventoAgente[]) {
  return {
    fin: finDeTurno(eventos),
    confs: confirmaciones(eventos).map((c) => ({ caso: c.caso, bloqueos: c.bloqueos })),
    simular: finesDeHerramienta(eventos).map((f) => ({ ok: f.ok, codigo: f.codigo ?? null })),
    texto: textoFinalSeguro(eventos),
  };
}

export async function lineasCaso(raiz: string, caso: string): Promise<{ herramienta?: string; ok?: boolean; codigo?: string | null }[]> {
  const ruta = join(raiz, OUT_DIR, caso, "log.jsonl");
  if (!existsSync(ruta)) return [];
  return (await readFile(ruta, "utf8")).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

export async function simularDelCaso(raiz: string, caso: string) {
  return (await lineasCaso(raiz, caso))
    .filter((l) => l.herramienta === NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO])
    .map((l) => ({ ok: l.ok, codigo: l.codigo ?? null }));
}

export { casosConEnvioSimulado };

const resultados: { test: string; nombre: string; ok: boolean; detalle: string }[] = [];
export function check(test: string, nombre: string, ok: boolean, detalle: unknown = "") {
  resultados.push({ test, nombre, ok, detalle: typeof detalle === "string" ? detalle : JSON.stringify(detalle) });
  console.log(`${ok ? "PASS" : "FAIL"} [${test}] ${nombre}${detalle === "" ? "" : ` :: ${typeof detalle === "string" ? detalle : JSON.stringify(detalle)}`}`);
}
export function totales() {
  const p = resultados.filter((r) => r.ok).length;
  console.log(`TOTAL pass=${p} fail=${resultados.length - p}`);
}
