import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { LineaBitacora } from "@tests/helpers/types/eventos.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { ARCHIVO_BITACORA, ARCHIVOS_SALIDA, OUT_DIR } from "@/config/constants/files.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import type {
  EventoAgente,
  EventoConfirmacionRequerida,
  EventoFinHerramienta,
  EventoFinTurno,
  EventoTexto,
} from "@/loop/types/evento.type.ts";

export const SIMULAR = `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.SIMULAR_ENVIO}`;

export function confirmaciones(eventos: readonly EventoAgente[]): EventoConfirmacionRequerida[] {
  return eventos.filter(
    (evento): evento is EventoConfirmacionRequerida => evento.tipo === TIPO_EVENTO.CONFIRMACION_REQUERIDA,
  );
}

export function textos(eventos: readonly EventoAgente[]): EventoTexto[] {
  return eventos.filter((evento): evento is EventoTexto => evento.tipo === TIPO_EVENTO.TEXTO);
}

export function finesDeHerramienta(
  eventos: readonly EventoAgente[],
  nombre = SIMULAR,
): EventoFinHerramienta[] {
  return eventos.filter(
    (evento): evento is EventoFinHerramienta =>
      evento.tipo === TIPO_EVENTO.FIN_HERRAMIENTA && evento.herramienta === nombre,
  );
}

export function finDeTurno(eventos: readonly EventoAgente[]): EventoFinTurno {
  const ultimo = eventos.at(-1);
  if (ultimo?.tipo !== TIPO_EVENTO.FIN_TURNO) throw new Error("falta turn_end");
  return ultimo;
}

export function textoFinal(eventos: readonly EventoAgente[]): string {
  const ultimo = textos(eventos).at(-1);
  if (ultimo === undefined) throw new Error("falta el evento text");
  return ultimo.texto;
}

export async function lineasBitacora(raiz: string): Promise<LineaBitacora[]> {
  const ruta = join(raiz, OUT_DIR, ARCHIVO_BITACORA);
  if (!existsSync(ruta)) return [];
  return (await readFile(ruta, "utf8"))
    .trim()
    .split("\n")
    .filter((linea) => linea !== "")
    .map((linea) => JSON.parse(linea));
}

export async function lineasDeEnvio(raiz: string): Promise<LineaBitacora[]> {
  return (await lineasBitacora(raiz)).filter((linea) => linea.herramienta === SIMULAR);
}

export async function casosConEnvioSimulado(raiz: string): Promise<string[]> {
  const out = join(raiz, OUT_DIR);
  if (!existsSync(out)) return [];
  const entradas = await readdir(out, { withFileTypes: true });
  return entradas
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .filter((caso) => existsSync(join(out, caso, ARCHIVOS_SALIDA.ENVIO_SIMULADO)))
    .sort();
}
