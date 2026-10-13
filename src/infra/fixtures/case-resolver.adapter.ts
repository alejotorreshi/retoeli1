import { readdir, realpath, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { ResolucionCaso } from "@/application/types/puertos.type.ts";
import { CASOS_DIR, FIXTURES_DIR } from "@/config/constants/files.constants.ts";
import { ESTADO_LECTURA, LECTURA_INVALIDA, LECTURA_NO_ENCONTRADA } from "@/config/constants/io.constants.ts";
import { PATRON_CASO } from "@/config/constants/patterns.constants.ts";
import { isNotFound } from "@/infra/fs/fs.util.ts";
import { isInside } from "@/infra/fs/safe-paths.util.ts";

function directorioCasos(raiz: string): string {
  return resolve(raiz, FIXTURES_DIR, CASOS_DIR);
}

export async function resolveCase(raiz: string, caso: string): Promise<ResolucionCaso> {
  if (!PATRON_CASO.test(caso)) return LECTURA_INVALIDA;
  try {
    const casosDir = await realpath(directorioCasos(raiz));
    const destino = await realpath(join(casosDir, caso));
    if (!isInside(casosDir, destino)) return LECTURA_INVALIDA;
    if (!(await stat(destino)).isDirectory()) return LECTURA_NO_ENCONTRADA;
    return { estado: ESTADO_LECTURA.OK, directorio: destino };
  } catch (error) {
    return isNotFound(error) ? LECTURA_NO_ENCONTRADA : LECTURA_INVALIDA;
  }
}

export async function listCases(raiz: string): Promise<readonly string[]> {
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
