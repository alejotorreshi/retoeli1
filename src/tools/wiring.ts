import type { Entorno, Lectura, Registrar, Reloj } from "../application/puertos.ts";
import { ARCHIVOS_CASO, PATRON_CASO, ZONA_HORARIA_POR_DEFECTO } from "../config/constantes.ts";
import { parseToolEnv, type ToolEnv } from "../config/env.ts";
import { exito, fallo, type Resultado } from "../domain/resultado.ts";
import type { Plantilla, TipoPlantilla } from "../domain/tipos.ts";
import { crearBitacora } from "../infra/bitacora.ts";
import {
  esquemaPlantillaCampos,
  esquemaPlantillaCeldas,
  esquemaSolicitud,
  esquemaSoportesExigidos,
} from "../infra/fixtures/esquemas.ts";
import { existeArchivo, leerJsonValidado, resolverRaiz, rutaEnCaso } from "../infra/fixtures/lector.ts";
import { relojFijo, relojSistema } from "../infra/reloj.ts";
import { listarCasos, resolverCaso } from "../infra/salida/rutas-seguras.ts";
import type { ContextoNormalizado } from "./define-tool.ts";
import { formatearIssues } from "./issues.ts";

export type EntornoEjecucion = {
  readonly registrar: Registrar;
  readonly entorno: Resultado<Entorno>;
};

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

function relojDe(config: ToolEnv): Reloj {
  return config.FECHA_EJECUCION === undefined
    ? relojSistema(config.TZ_NEGOCIO)
    : relojFijo(config.FECHA_EJECUCION);
}

function entornoDeFixtures(raiz: string, reloj: Reloj): Entorno {
  return {
    raiz,
    patronCaso: PATRON_CASO,
    reloj,
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

export function crearEntorno(contexto: ContextoNormalizado): EntornoEjecucion {
  const raiz = resolverRaiz(contexto.directorio);
  const config = parseToolEnv(process.env);
  if (!config.success) {
    return {
      registrar: crearBitacora(raiz, relojSistema(ZONA_HORARIA_POR_DEFECTO)),
      entorno: fallo("CONFIGURACION_INVALIDA", { detalle: formatearIssues(config.error.issues) }),
    };
  }
  const reloj = relojDe(config.data);
  return { registrar: crearBitacora(raiz, reloj), entorno: exito(entornoDeFixtures(raiz, reloj)) };
}
