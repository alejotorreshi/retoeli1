import { realpath } from "node:fs/promises";
import { join, sep } from "node:path";
import {
  ARCHIVOS_SALIDA,
  NOMBRES_RESERVADOS_PAQUETE,
  OUT_DIR,
  PATRON_ARCHIVO_SOPORTE,
  PATRON_CASO,
} from "@/config/constantes.ts";
import { directorioSoportes } from "@/infra/fixtures/lector.ts";
import { directorioSalidaCaso, rutaRelativa } from "@/infra/salida/rutas-seguras.ts";

const COPIAS_DE_FORMULARIO: ReadonlySet<string> = new Set([
  ARCHIVOS_SALIDA.paqueteFormularioXlsx,
  ARCHIVOS_SALIDA.paqueteFormularioPdf,
  ARCHIVOS_SALIDA.paqueteValoresPortal,
]);

function dentroDe(base: string, ruta: string): boolean {
  return ruta.startsWith(base + sep);
}

function esCopiaDeFormulario(nombre: string): boolean {
  return COPIAS_DE_FORMULARIO.has(`${ARCHIVOS_SALIDA.paquete}/${nombre}`);
}

function esCopiaDeSoporte(nombre: string): boolean {
  return (
    PATRON_ARCHIVO_SOPORTE.test(nombre) && !nombre.includes("..") && !NOMBRES_RESERVADOS_PAQUETE.has(nombre)
  );
}

async function directoriosReales(
  raiz: string,
  caso: string,
): Promise<{ readonly caso: string; readonly paquete: string; readonly soportes: string }> {
  const salidaReal = await realpath(join(raiz, OUT_DIR));
  const casoReal = await realpath(directorioSalidaCaso(raiz, caso));
  if (!dentroDe(salidaReal, casoReal)) throw new RangeError("La carpeta de salida del caso sale de out/.");
  const paqueteReal = await realpath(join(casoReal, ARCHIVOS_SALIDA.paquete));
  if (!dentroDe(casoReal, paqueteReal)) throw new RangeError("La carpeta del paquete sale del caso.");
  return { caso: casoReal, paquete: paqueteReal, soportes: await realpath(directorioSoportes(raiz)) };
}

function origenPermitido(
  origenReal: string,
  directorios: { readonly caso: string; readonly paquete: string; readonly soportes: string },
): boolean {
  if (dentroDe(directorios.soportes, origenReal)) return true;
  return dentroDe(directorios.caso, origenReal) && !dentroDe(directorios.paquete, origenReal);
}

export async function copiarAlPaquete(
  raiz: string,
  caso: string,
  origenAbs: string,
  nombreDestino: string,
): Promise<string> {
  if (!PATRON_CASO.test(caso)) throw new RangeError("El caso no es válido para copiar al paquete.");
  if (!esCopiaDeFormulario(nombreDestino) && !esCopiaDeSoporte(nombreDestino)) {
    throw new RangeError("El archivo de destino no está permitido en el paquete.");
  }
  const directorios = await directoriosReales(raiz, caso);
  const origenReal = await realpath(origenAbs);
  if (!origenPermitido(origenReal, directorios)) {
    throw new RangeError("El origen de la copia no está en los soportes ni en la salida del caso.");
  }
  await Bun.write(join(directorios.paquete, nombreDestino), Bun.file(origenReal));
  return rutaRelativa(raiz, join(directorioSalidaCaso(raiz, caso), ARCHIVOS_SALIDA.paquete, nombreDestino));
}
