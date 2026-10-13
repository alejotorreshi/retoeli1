import { readdir, realpath, stat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import type { ResolucionCaso } from "@/application/puertos.ts";
import { CASOS_DIR, FIXTURES_DIR, OUT_DIR } from "@/config/constants/files.constants.ts";
import { ESTADO_LECTURA } from "@/config/constants/io.constants.ts";
import { PATRON_CASO } from "@/config/constants/patterns.constants.ts";

const NO_ENCONTRADO = { estado: ESTADO_LECTURA.NO_ENCONTRADO } as const;
const INVALIDO = { estado: ESTADO_LECTURA.INVALIDO } as const;
const CODIGOS_NO_ENCONTRADO: ReadonlySet<string> = new Set(["ENOENT", "ENOTDIR"]);

function esNoEncontrado(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return typeof error.code === "string" && CODIGOS_NO_ENCONTRADO.has(error.code);
}

function directorioCasos(raiz: string): string {
  return resolve(raiz, FIXTURES_DIR, CASOS_DIR);
}

export async function resolverCaso(raiz: string, caso: string): Promise<ResolucionCaso> {
  if (!PATRON_CASO.test(caso)) return INVALIDO;
  try {
    const casosDir = await realpath(directorioCasos(raiz));
    const destino = await realpath(join(casosDir, caso));
    if (!destino.startsWith(casosDir + sep)) return INVALIDO;
    if (!(await stat(destino)).isDirectory()) return NO_ENCONTRADO;
    return { estado: ESTADO_LECTURA.OK, directorio: destino };
  } catch (error) {
    return esNoEncontrado(error) ? NO_ENCONTRADO : INVALIDO;
  }
}

export async function listarCasos(raiz: string): Promise<readonly string[]> {
  try {
    const entradas = await readdir(directorioCasos(raiz), { withFileTypes: true });
    return entradas
      .filter((entrada) => entrada.isDirectory() && PATRON_CASO.test(entrada.name))
      .map((entrada) => entrada.name)
      .sort();
  } catch {
    return [];
  }
}

export function rutaRelativa(raiz: string, absoluta: string): string {
  return relative(raiz, absoluta).split(sep).join("/");
}

export function directorioSalidaCaso(raiz: string, caso: string): string {
  return join(raiz, OUT_DIR, caso);
}
