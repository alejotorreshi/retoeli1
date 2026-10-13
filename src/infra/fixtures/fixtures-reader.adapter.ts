import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { z } from "zod";
import type { Lectura } from "@/application/types/puertos.type.ts";
import { CODIGOS_FS_NO_ENCONTRADO } from "@/config/constants/errors.constants.ts";
import {
  ARCHIVOS_REPOSITORIO,
  FIXTURES_DIR,
  INDICE_SOPORTES,
  SOPORTES_DIR,
} from "@/config/constants/files.constants.ts";
import { ESTADO_LECTURA } from "@/config/constants/io.constants.ts";
import { LIMITE_LECTURA_BYTES } from "@/config/constants/limits.constants.ts";
import { PATRON_ARCHIVO_SOPORTE } from "@/config/constants/patterns.constants.ts";
import type { SoporteIndice } from "@/domain/types/checklist.type.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { Glosario } from "@/domain/types/mapeo.type.ts";
import {
  glossarySchema,
  masterSchema,
  supportIndexSchema,
} from "@/infra/fixtures/schemas/fixtures.schema.ts";

const NO_ENCONTRADO = { estado: ESTADO_LECTURA.NO_ENCONTRADO } as const;
const INVALIDO = { estado: ESTADO_LECTURA.INVALIDO } as const;

function esNoEncontrado(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return typeof error.code === "string" && CODIGOS_FS_NO_ENCONTRADO.has(error.code);
}

function parsearJson(texto: string): { readonly ok: true; readonly valor: unknown } | { readonly ok: false } {
  try {
    return { ok: true, valor: JSON.parse(texto) };
  } catch {
    return { ok: false };
  }
}

export function resolveRoot(directorio: string): string {
  return resolve(directorio);
}

export function pathInCase(directorioCaso: string, archivo: string): string {
  return join(directorioCaso, archivo);
}

export async function fileExists(rutaAbs: string): Promise<boolean> {
  try {
    return (await stat(rutaAbs)).isFile();
  } catch {
    return false;
  }
}

export async function readValidatedJson<T>(rutaAbs: string, esquema: z.ZodType<T>): Promise<Lectura<T>> {
  try {
    const info = await stat(rutaAbs);
    if (!info.isFile() || info.size > LIMITE_LECTURA_BYTES) return INVALIDO;
    const json = parsearJson(await readFile(rutaAbs, "utf8"));
    if (!json.ok) return INVALIDO;
    const validado = esquema.safeParse(json.valor);
    return validado.success ? { estado: ESTADO_LECTURA.OK, valor: validado.data } : INVALIDO;
  } catch (error) {
    return esNoEncontrado(error) ? NO_ENCONTRADO : INVALIDO;
  }
}

export function readMaster(raiz: string): Promise<Lectura<Maestro>> {
  return readValidatedJson(resolve(raiz, FIXTURES_DIR, ARCHIVOS_REPOSITORIO.maestro), masterSchema);
}

export function readGlossary(raiz: string): Promise<Lectura<Glosario>> {
  return readValidatedJson(resolve(raiz, FIXTURES_DIR, ARCHIVOS_REPOSITORIO.glosario), glossarySchema);
}

export function supportsDirectory(raiz: string): string {
  return resolve(raiz, FIXTURES_DIR, SOPORTES_DIR);
}

export function readSupportIndex(raiz: string): Promise<Lectura<readonly SoporteIndice[]>> {
  return readValidatedJson(join(supportsDirectory(raiz), INDICE_SOPORTES), supportIndexSchema);
}

export async function presentSupports(raiz: string): Promise<Lectura<ReadonlySet<string>>> {
  try {
    const entradas = await readdir(supportsDirectory(raiz), { withFileTypes: true });
    const archivos = entradas
      .filter(
        (entrada) =>
          entrada.isFile() && entrada.name !== INDICE_SOPORTES && PATRON_ARCHIVO_SOPORTE.test(entrada.name),
      )
      .map((entrada) => entrada.name);
    return { estado: ESTADO_LECTURA.OK, valor: new Set(archivos) };
  } catch (error) {
    return esNoEncontrado(error) ? NO_ENCONTRADO : INVALIDO;
  }
}
