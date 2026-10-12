import { mkdir, realpath, writeFile } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import { ARCHIVOS_SALIDA, OUT_DIR, PATRON_CASO } from "../../config/constantes.ts";
import { directorioSalidaCaso, rutaRelativa } from "./rutas-seguras.ts";

const NOMBRES_PERMITIDOS: ReadonlySet<string> = new Set(Object.values(ARCHIVOS_SALIDA));

function dentroDe(base: string, destino: string): boolean {
  return destino.startsWith(base + sep);
}

export async function escribirArchivoSalida(
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
