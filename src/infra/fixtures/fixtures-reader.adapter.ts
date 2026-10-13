import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { z } from "zod";
import type { Lectura } from "@/application/types/puertos.type.ts";
import {
  ARCHIVOS_REPOSITORIO,
  FIXTURES_DIR,
  INDICE_SOPORTES,
  SOPORTES_DIR,
} from "@/config/constants/files.constants.ts";
import { ESTADO_LECTURA, LECTURA_INVALIDA, LECTURA_NO_ENCONTRADA } from "@/config/constants/io.constants.ts";
import { PATRON_ARCHIVO_SOPORTE } from "@/config/constants/patterns.constants.ts";
import type { Glosario } from "@/domain/types/glosario.type.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { SoporteIndice } from "@/domain/types/soportes.type.ts";
import { parsearJson } from "@/domain/utils/json.util.ts";
import {
  glossarySchema,
  masterSchema,
  supportIndexSchema,
} from "@/infra/fixtures/schemas/fixtures.schema.ts";
import { isNotFound, readBoundedText } from "@/infra/fs/fs.util.ts";

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
    const texto = await readBoundedText(rutaAbs);
    if (texto === null) return LECTURA_INVALIDA;
    const json = parsearJson(texto);
    if (!json.ok) return LECTURA_INVALIDA;
    const validado = esquema.safeParse(json.valor);
    return validado.success ? { estado: ESTADO_LECTURA.OK, valor: validado.data } : LECTURA_INVALIDA;
  } catch (error) {
    return isNotFound(error) ? LECTURA_NO_ENCONTRADA : LECTURA_INVALIDA;
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
    return isNotFound(error) ? LECTURA_NO_ENCONTRADA : LECTURA_INVALIDA;
  }
}
