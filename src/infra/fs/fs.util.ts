import { readFile, stat } from "node:fs/promises";
import { CODIGOS_FS_NO_ENCONTRADO } from "@/config/constants/errors.constants.ts";
import { LIMITE_LECTURA_BYTES } from "@/config/constants/limits.constants.ts";
import type { ParsedJson } from "@/infra/types/fs.type.ts";

export function isNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return typeof error.code === "string" && CODIGOS_FS_NO_ENCONTRADO.has(error.code);
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
