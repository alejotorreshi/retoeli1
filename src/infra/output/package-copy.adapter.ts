import { realpath } from "node:fs/promises";
import { join } from "node:path";
import {
  ARCHIVO_FORMULARIO,
  DIRECTORIO_PAQUETE,
  NOMBRES_RESERVADOS_PAQUETE,
} from "@/config/constants/files.constants.ts";
import { PATRON_ARCHIVO_SOPORTE, PATRON_CASO } from "@/config/constants/patterns.constants.ts";
import { TEXTO_INFRA } from "@/config/strings.ts";
import { supportsDirectory } from "@/infra/fixtures/fixtures-reader.adapter.ts";
import {
  caseOutputDirectory,
  isInside,
  realCaseDirectory,
  realPackageDirectory,
  relativePath,
} from "@/infra/fs/safe-paths.util.ts";

const COPIAS_DE_FORMULARIO: ReadonlySet<string> = new Set(Object.values(ARCHIVO_FORMULARIO));

function esCopiaDeFormulario(nombre: string): boolean {
  return COPIAS_DE_FORMULARIO.has(nombre);
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
  const casoReal = await realCaseDirectory(raiz, caso);
  const paqueteReal = await realPackageDirectory(casoReal);
  return { caso: casoReal, paquete: paqueteReal, soportes: await realpath(supportsDirectory(raiz)) };
}

function origenPermitido(
  origenReal: string,
  directorios: { readonly caso: string; readonly paquete: string; readonly soportes: string },
): boolean {
  if (isInside(directorios.soportes, origenReal)) return true;
  return isInside(directorios.caso, origenReal) && !isInside(directorios.paquete, origenReal);
}

export async function copyIntoPackage(
  raiz: string,
  caso: string,
  origenAbs: string,
  nombreDestino: string,
): Promise<string> {
  if (!PATRON_CASO.test(caso)) throw new RangeError(TEXTO_INFRA.casoInvalidoParaCopiar);
  if (!esCopiaDeFormulario(nombreDestino) && !esCopiaDeSoporte(nombreDestino)) {
    throw new RangeError(TEXTO_INFRA.destinoNoPermitido);
  }
  const directorios = await directoriosReales(raiz, caso);
  const origenReal = await realpath(origenAbs);
  if (!origenPermitido(origenReal, directorios)) {
    throw new RangeError(TEXTO_INFRA.origenNoPermitido);
  }
  await Bun.write(join(directorios.paquete, nombreDestino), Bun.file(origenReal));
  return relativePath(raiz, join(caseOutputDirectory(raiz, caso), DIRECTORIO_PAQUETE, nombreDestino));
}
