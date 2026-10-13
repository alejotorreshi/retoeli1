import { mkdir, realpath } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { DIRECTORIO_PAQUETE, OUT_DIR } from "@/config/constants/files.constants.ts";
import { TEXTO_INFRA } from "@/config/strings.ts";
import { isNotFound } from "@/infra/fs/fs.util.ts";

export function relativePath(raiz: string, absoluta: string): string {
  return relative(raiz, absoluta).split(sep).join("/");
}

export function caseOutputDirectory(raiz: string, caso: string): string {
  return join(raiz, OUT_DIR, caso);
}

export function isInside(base: string, ruta: string): boolean {
  return ruta.startsWith(base + sep);
}

async function insideOutput(raiz: string, casoReal: string): Promise<string> {
  const salidaReal = await realpath(join(raiz, OUT_DIR));
  if (!isInside(salidaReal, casoReal)) throw new RangeError(TEXTO_INFRA.salidaFueraDeOut);
  return casoReal;
}

export async function ensureRealCaseDirectory(raiz: string, caso: string): Promise<string> {
  const directorio = caseOutputDirectory(raiz, caso);
  await mkdir(directorio, { recursive: true });
  return insideOutput(raiz, await realpath(directorio));
}

export async function realCaseDirectory(raiz: string, caso: string): Promise<string> {
  return insideOutput(raiz, await realpath(caseOutputDirectory(raiz, caso)));
}

export async function existingRealCaseDirectory(raiz: string, caso: string): Promise<string | null> {
  try {
    return await realCaseDirectory(raiz, caso);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function realPackageDirectory(casoReal: string): Promise<string> {
  const paqueteReal = await realpath(join(casoReal, DIRECTORIO_PAQUETE));
  if (!isInside(casoReal, paqueteReal)) throw new RangeError(TEXTO_INFRA.paqueteFueraDelCaso);
  return paqueteReal;
}
