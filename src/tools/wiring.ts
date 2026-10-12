import type { Entorno, Lectura, Registrar, Reloj } from "../application/puertos.ts";
import {
  ARCHIVOS_CASO,
  ARCHIVOS_SALIDA,
  PATRON_CASO,
  ZONA_HORARIA_POR_DEFECTO,
} from "../config/constantes.ts";
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
import {
  existeArchivo,
  leerGlosario,
  leerJsonValidado,
  leerMaestro,
  resolverRaiz,
  rutaEnCaso,
} from "../infra/fixtures/lector.ts";
import { cargarPlantillaTexto } from "../infra/knowledge/plantillas.ts";
import { cargarReglas, DIRECTORIO_CONOCIMIENTO_POR_DEFECTO } from "../infra/knowledge/reglas.ts";
import { relojFijo, relojSistema } from "../infra/reloj.ts";
import {
  escribirArchivoSalida,
  escribirBinarioSalida,
  limpiarArtefactosPrevios,
} from "../infra/salida/archivos.ts";
import { conCandadoCaso } from "../infra/salida/mutex.ts";
import { renderizarPdf } from "../infra/salida/pdf/render.ts";
import { directorioSalidaCaso, listarCasos, resolverCaso } from "../infra/salida/rutas-seguras.ts";
import { escribirXlsx } from "../infra/salida/xlsx.ts";
import type { ContextoNormalizado } from "./define-tool.ts";
import { formatearIssues } from "./issues.ts";

export type OpcionesEntorno = { readonly directorioConocimiento?: string };

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

function entornoDeFixtures(raiz: string, reloj: Reloj, directorioConocimiento: string): Entorno {
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
    salida: {
      escribir: (caso, archivo, contenido) =>
        escribirArchivoSalida(raiz, caso, ARCHIVOS_SALIDA[archivo], contenido),
      binario: (caso, archivo, bytes) => escribirBinarioSalida(raiz, caso, ARCHIVOS_SALIDA[archivo], bytes),
      limpiarPrevios: (caso) => limpiarArtefactosPrevios(raiz, caso),
    },
    formularios: { xlsx: escribirXlsx, pdf: renderizarPdf },
    plantillas: {
      cargar: (reglas, clave) => cargarPlantillaTexto(directorioConocimiento, reglas, clave),
    },
    candado: (caso, seccion) => conCandadoCaso(directorioSalidaCaso(raiz, caso), seccion),
    reglas: () => cargarReglas(directorioConocimiento),
    maestro: () => leerMaestro(raiz),
    glosario: () => leerGlosario(raiz),
  };
}

export function crearEntorno(
  contexto: ContextoNormalizado,
  opciones: OpcionesEntorno = {},
): EntornoEjecucion {
  const raiz = resolverRaiz(contexto.directorio);
  const config = parseToolEnv(process.env);
  if (!config.success) {
    return {
      registrar: crearBitacora(raiz, relojSistema(ZONA_HORARIA_POR_DEFECTO)),
      entorno: fallo("CONFIGURACION_INVALIDA", { detalle: formatearIssues(config.error.issues) }),
    };
  }
  const reloj = relojDe(config.data);
  const directorioConocimiento = opciones.directorioConocimiento ?? DIRECTORIO_CONOCIMIENTO_POR_DEFECTO;
  return {
    registrar: crearBitacora(raiz, reloj),
    entorno: exito(entornoDeFixtures(raiz, reloj, directorioConocimiento)),
  };
}
