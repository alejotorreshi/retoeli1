import { mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import { ARCHIVOS_SALIDA, OUT_DIR, PATRON_CASO } from "../../config/constantes.ts";
import { directorioSalidaCaso, rutaRelativa } from "./rutas-seguras.ts";

const NOMBRES_PERMITIDOS: ReadonlySet<string> = new Set(Object.values(ARCHIVOS_SALIDA));

function dentroDe(base: string, destino: string): boolean {
  return destino.startsWith(base + sep);
}

async function escribirContenido(
  raiz: string,
  caso: string,
  nombre: string,
  contenido: string | Uint8Array,
): Promise<string> {
  if (!PATRON_CASO.test(caso)) throw new RangeError("El caso no es válido para escribir una salida.");
  if (!NOMBRES_PERMITIDOS.has(nombre))
    throw new RangeError("El archivo de salida no está en la lista blanca.");
  const directorioCaso = directorioSalidaCaso(raiz, caso);
  const destino = join(directorioCaso, nombre);
  await mkdir(directorioCaso, { recursive: true });
  const salidaReal = await realpath(join(raiz, OUT_DIR));
  const casoReal = await realpath(directorioCaso);
  if (!dentroDe(salidaReal, casoReal)) {
    throw new RangeError("La carpeta de salida del caso sale de out/.");
  }
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, contenido);
  return rutaRelativa(raiz, destino);
}

export function escribirArchivoSalida(
  raiz: string,
  caso: string,
  nombre: string,
  contenido: string,
): Promise<string> {
  return escribirContenido(raiz, caso, nombre, contenido);
}

export function escribirBinarioSalida(
  raiz: string,
  caso: string,
  nombre: string,
  bytes: Uint8Array,
): Promise<string> {
  return escribirContenido(raiz, caso, nombre, bytes);
}

function noExiste(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

async function realOAusente(ruta: string): Promise<string | null> {
  try {
    return await realpath(ruta);
  } catch (error) {
    if (noExiste(error)) return null;
    throw error;
  }
}

export async function limpiarArtefactosPrevios(raiz: string, caso: string): Promise<void> {
  if (!PATRON_CASO.test(caso)) throw new RangeError("El caso no es válido para limpiar salidas.");
  const casoReal = await realOAusente(directorioSalidaCaso(raiz, caso));
  if (casoReal === null) return;
  const salidaReal = await realpath(join(raiz, OUT_DIR));
  if (!dentroDe(salidaReal, casoReal)) {
    throw new RangeError("La carpeta de salida del caso sale de out/.");
  }
  await rm(join(casoReal, ARCHIVOS_SALIDA.paquete), { recursive: true, force: true });
  await rm(join(casoReal, ARCHIVOS_SALIDA.envioSimulado), { force: true });
}
