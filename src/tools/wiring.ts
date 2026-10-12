import type { Entorno, Lectura } from "../application/puertos.ts";
import { ARCHIVOS_CASO, PATRON_CASO } from "../config/constantes.ts";
import type { Plantilla, TipoPlantilla } from "../domain/tipos.ts";
import {
  esquemaPlantillaCampos,
  esquemaPlantillaCeldas,
  esquemaSolicitud,
  esquemaSoportesExigidos,
} from "../infra/fixtures/esquemas.ts";
import { existeArchivo, leerJsonValidado, resolverRaiz, rutaArchivoCaso } from "../infra/fixtures/lector.ts";
import type { ContextoNormalizado } from "./define-tool.ts";

const ARCHIVO_PLANTILLA: Readonly<Record<TipoPlantilla, string>> = {
  celdas: ARCHIVOS_CASO.plantillaCeldas,
  campos: ARCHIVOS_CASO.plantillaCampos,
};

async function leerPlantilla(raiz: string, caso: string, tipo: TipoPlantilla): Promise<Lectura<Plantilla>> {
  const archivo = ARCHIVO_PLANTILLA[tipo];
  const ruta = rutaArchivoCaso(raiz, caso, archivo);
  if (tipo === "celdas") {
    const lectura = await leerJsonValidado(ruta, esquemaPlantillaCeldas);
    return lectura.estado === "ok"
      ? { estado: "ok", valor: { tipo, archivo, campos: lectura.valor } }
      : lectura;
  }
  const lectura = await leerJsonValidado(ruta, esquemaPlantillaCampos);
  return lectura.estado === "ok"
    ? { estado: "ok", valor: { tipo, archivo, campos: lectura.valor } }
    : lectura;
}

export function crearEntorno(contexto: ContextoNormalizado): Entorno {
  const raiz = resolverRaiz(contexto.directorio);
  return {
    raiz,
    patronCaso: PATRON_CASO,
    fixtures: {
      leerSolicitud: (caso) =>
        leerJsonValidado(rutaArchivoCaso(raiz, caso, ARCHIVOS_CASO.solicitud), esquemaSolicitud),
      leerSoportesExigidos: (caso) =>
        leerJsonValidado(
          rutaArchivoCaso(raiz, caso, ARCHIVOS_CASO.soportesExigidos),
          esquemaSoportesExigidos,
        ),
      existePlantilla: (caso, tipo) => existeArchivo(rutaArchivoCaso(raiz, caso, ARCHIVO_PLANTILLA[tipo])),
      leerPlantilla: (caso, tipo) => leerPlantilla(raiz, caso, tipo),
    },
  };
}
