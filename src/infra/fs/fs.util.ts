import { constants } from "node:fs";
import { type FileHandle, open, readFile, stat } from "node:fs/promises";
import { CODIGO_FS, CODIGOS_FS_NO_ENCONTRADO } from "@/config/constants/errors.constants.ts";
import { LIMITE_LECTURA_BYTES } from "@/config/constants/limits.constants.ts";
import { TEXTO_INFRA } from "@/config/strings.ts";
import type { ParsedJson } from "@/infra/types/fs.type.ts";

function fsCodeOf(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}

export function isNotFound(error: unknown): boolean {
  const codigo = fsCodeOf(error);
  return codigo !== null && CODIGOS_FS_NO_ENCONTRADO.has(codigo);
}

export function parseJson(texto: string): ParsedJson {
  try {
    return { ok: true, valor: JSON.parse(texto) };
  } catch {
    return { ok: false };
  }
}

export async function readBoundedText(ruta: string): Promise<string | null> {
  const info = await stat(ruta);
  if (!info.isFile() || info.size > LIMITE_LECTURA_BYTES) return null;
  return readFile(ruta, "utf8");
}

export async function readText(ruta: string): Promise<string | null> {
  try {
    return await readBoundedText(ruta);
  } catch {
    return null;
  }
}

async function openWithoutFollowing(ruta: string): Promise<FileHandle | null> {
  try {
    return await open(ruta, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if (isNotFound(error)) return null;
    if (fsCodeOf(error) === CODIGO_FS.ELOOP) throw new RangeError(TEXTO_INFRA.archivoNoPropio);
    throw error;
  }
}

export async function readOwnRegularText(ruta: string): Promise<string | null> {
  const manejador = await openWithoutFollowing(ruta);
  if (manejador === null) return null;
  try {
    const info = await manejador.stat();
    if (!info.isFile() || info.nlink !== 1 || info.size > LIMITE_LECTURA_BYTES)
      throw new RangeError(TEXTO_INFRA.archivoNoPropio);
    return await manejador.readFile("utf8");
  } finally {
    await manejador.close();
  }
}
