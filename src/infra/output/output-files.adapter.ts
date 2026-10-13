import { mkdir, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import { CODIGO_FS } from "@/config/constants/errors.constants.ts";
import {
  ARCHIVOS_PAQUETE,
  ARCHIVOS_REGENERABLES,
  ARCHIVOS_SALIDA,
  DIRECTORIO_PAQUETE,
  OUT_DIR,
} from "@/config/constants/files.constants.ts";
import { PATRON_CASO } from "@/config/constants/patterns.constants.ts";
import { TEXTO_INFRA } from "@/config/strings.ts";
import { caseOutputDirectory, relativePath } from "@/infra/fs/safe-paths.util.ts";

export function packagePath(nombre: string): string {
  return `${DIRECTORIO_PAQUETE}/${nombre}`;
}

const NOMBRES_PERMITIDOS: ReadonlySet<string> = new Set([
  ...Object.values(ARCHIVOS_SALIDA),
  ...Object.values(ARCHIVOS_PAQUETE).map(packagePath),
]);

function dentroDe(base: string, destino: string): boolean {
  return destino.startsWith(base + sep);
}

async function casoRealDentroDeSalida(raiz: string, caso: string): Promise<string> {
  const directorioCaso = caseOutputDirectory(raiz, caso);
  await mkdir(directorioCaso, { recursive: true });
  const salidaReal = await realpath(join(raiz, OUT_DIR));
  const casoReal = await realpath(directorioCaso);
  if (!dentroDe(salidaReal, casoReal)) {
    throw new RangeError(TEXTO_INFRA.salidaFueraDeOut);
  }
  return casoReal;
}

async function escribirContenido(
  raiz: string,
  caso: string,
  nombre: string,
  contenido: string | Uint8Array,
): Promise<string> {
  if (!PATRON_CASO.test(caso)) throw new RangeError(TEXTO_INFRA.casoInvalidoParaEscribir);
  if (!NOMBRES_PERMITIDOS.has(nombre)) throw new RangeError(TEXTO_INFRA.archivoFueraDeListaBlanca);
  const destino = join(caseOutputDirectory(raiz, caso), nombre);
  await casoRealDentroDeSalida(raiz, caso);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, contenido);
  return relativePath(raiz, destino);
}

export function writeOutputFile(
  raiz: string,
  caso: string,
  nombre: string,
  contenido: string,
): Promise<string> {
  return escribirContenido(raiz, caso, nombre, contenido);
}

export function writeOutputBinary(
  raiz: string,
  caso: string,
  nombre: string,
  bytes: Uint8Array,
): Promise<string> {
  return escribirContenido(raiz, caso, nombre, bytes);
}

function noExiste(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === CODIGO_FS.ENOENT;
}

async function realOAusente(ruta: string): Promise<string | null> {
  try {
    return await realpath(ruta);
  } catch (error) {
    if (noExiste(error)) return null;
    throw error;
  }
}

export async function resetPackage(raiz: string, caso: string): Promise<string> {
  if (!PATRON_CASO.test(caso)) throw new RangeError(TEXTO_INFRA.casoInvalidoParaArmar);
  const casoReal = await casoRealDentroDeSalida(raiz, caso);
  const paquete = join(casoReal, DIRECTORIO_PAQUETE);
  await rm(paquete, { recursive: true, force: true });
  await mkdir(paquete);
  return relativePath(raiz, join(caseOutputDirectory(raiz, caso), DIRECTORIO_PAQUETE));
}

export async function listPackage(raiz: string, caso: string): Promise<readonly string[]> {
  if (!PATRON_CASO.test(caso)) throw new RangeError(TEXTO_INFRA.casoInvalidoParaListar);
  const casoReal = await casoRealDentroDeSalida(raiz, caso);
  const entradas = await readdir(join(casoReal, DIRECTORIO_PAQUETE), { withFileTypes: true });
  return entradas
    .filter((entrada) => entrada.isFile())
    .map((entrada) => entrada.name)
    .sort();
}

export async function clearPreviousArtifacts(raiz: string, caso: string): Promise<void> {
  if (!PATRON_CASO.test(caso)) throw new RangeError(TEXTO_INFRA.casoInvalidoParaLimpiar);
  const casoReal = await realOAusente(caseOutputDirectory(raiz, caso));
  if (casoReal === null) return;
  const salidaReal = await realpath(join(raiz, OUT_DIR));
  if (!dentroDe(salidaReal, casoReal)) {
    throw new RangeError(TEXTO_INFRA.salidaFueraDeOut);
  }
  await rm(join(casoReal, DIRECTORIO_PAQUETE), { recursive: true, force: true });
  for (const nombre of ARCHIVOS_REGENERABLES) await rm(join(casoReal, nombre), { force: true });
}
