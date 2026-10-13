import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { LineaBitacora } from "@tests/helpers/types/eventos.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { ARCHIVO_BITACORA, ARCHIVOS_SALIDA, OUT_DIR } from "@/config/constants/files.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type {
  EventoAgente,
  EventoConfirmacionRequerida,
  EventoError,
  EventoFinHerramienta,
  EventoFinTurno,
  EventoInicioTurno,
  EventoTexto,
  EventoUso,
} from "@/loop/types/evento.type.ts";

export const SIMULAR = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];

export async function recoger(eventos: AsyncIterable<EventoAgente>): Promise<EventoAgente[]> {
  const recogidos: EventoAgente[] = [];
  for await (const evento of eventos) recogidos.push(evento);
  return recogidos;
}

export function inicioDe(eventos: readonly EventoAgente[]): EventoInicioTurno {
  const inicio = eventos[0];
  if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error(`falta ${TIPO_EVENTO.INICIO_TURNO}`);
  return inicio;
}

export function sesionDe(eventos: readonly EventoAgente[]): string {
  return inicioDe(eventos).sesionId;
}

export function confirmaciones(eventos: readonly EventoAgente[]): EventoConfirmacionRequerida[] {
  return eventos.filter(
    (evento): evento is EventoConfirmacionRequerida => evento.tipo === TIPO_EVENTO.CONFIRMACION_REQUERIDA,
  );
}

export function textos(eventos: readonly EventoAgente[]): EventoTexto[] {
  return eventos.filter((evento): evento is EventoTexto => evento.tipo === TIPO_EVENTO.TEXTO);
}

export function errores(eventos: readonly EventoAgente[]): EventoError[] {
  return eventos.filter((evento): evento is EventoError => evento.tipo === TIPO_EVENTO.ERROR);
}

export function usos(eventos: readonly EventoAgente[]): EventoUso[] {
  return eventos.filter((evento): evento is EventoUso => evento.tipo === TIPO_EVENTO.USO);
}

export function finesDeHerramienta(
  eventos: readonly EventoAgente[],
  nombre: string = SIMULAR,
): EventoFinHerramienta[] {
  return eventos.filter(
    (evento): evento is EventoFinHerramienta =>
      evento.tipo === TIPO_EVENTO.FIN_HERRAMIENTA && evento.herramienta === nombre,
  );
}

export function finDeTurno(eventos: readonly EventoAgente[]): EventoFinTurno {
  const ultimo = eventos.at(-1);
  if (ultimo?.tipo !== TIPO_EVENTO.FIN_TURNO) throw new Error(`falta ${TIPO_EVENTO.FIN_TURNO}`);
  return ultimo;
}

export function textoFinal(eventos: readonly EventoAgente[]): string {
  const ultimo = textos(eventos).at(-1);
  if (ultimo === undefined) throw new Error(`falta el evento ${TIPO_EVENTO.TEXTO}`);
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
