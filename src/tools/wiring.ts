import type { Entorno, Lectura } from "../application/puertos.ts";
import { ARCHIVOS_CASO, PATRON_CASO } from "../config/constantes.ts";
import type { Plantilla, TipoPlantilla } from "../domain/tipos.ts";
import {
  esquemaPlantillaCampos,
  esquemaPlantillaCeldas,
  esquemaSolicitud,
  esquemaSoportesExigidos,
} from "../infra/fixtures/esquemas.ts";
import { existeArchivo, leerJsonValidado, resolverRaiz, rutaEnCaso } from "../infra/fixtures/lector.ts";
import { listarCasos, resolverCaso } from "../infra/salida/rutas-seguras.ts";
import type { ContextoNormalizado } from "./define-tool.ts";

const ARCHIVO_PLANTILLA: Readonly<Record<TipoPlantilla, string>> = {
  celdas: ARCHIVOS_CASO.plantillaCeldas,
  campos: ARCHIVOS_CASO.plantillaCampos,
};

async function leerPlantilla(directorioCaso: string, tipo: TipoPlantilla): Promise<Lectura<Plantilla>> {
  const archivo = ARCHIVO_PLANTILLA[tipo];
  const ruta = rutaEnCaso(directorioCaso, archivo);
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
    casos: {
      resolver: (caso) => resolverCaso(raiz, caso),
      disponibles: () => listarCasos(raiz),
    },
    fixtures: {
      leerSolicitud: (directorio) =>
        leerJsonValidado(rutaEnCaso(directorio, ARCHIVOS_CASO.solicitud), esquemaSolicitud),
      leerSoportesExigidos: (directorio) =>
        leerJsonValidado(rutaEnCaso(directorio, ARCHIVOS_CASO.soportesExigidos), esquemaSoportesExigidos),
      existePlantilla: (directorio, tipo) => existeArchivo(rutaEnCaso(directorio, ARCHIVO_PLANTILLA[tipo])),
      leerPlantilla,
    },
  };
}
