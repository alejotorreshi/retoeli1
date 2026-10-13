import type { Entorno, Lectura, OrigenCopia, Registrar, Reloj } from "@/application/types/puertos.type.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVO_PLANTILLA, ARCHIVOS_CASO } from "@/config/constants/files.constants.ts";
import { TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import { ESTADO_LECTURA, ORIGEN_COPIA } from "@/config/constants/io.constants.ts";
import { ZONA_HORARIA_POR_DEFECTO } from "@/config/constants/runtime.constants.ts";
import { readToolEnv, type ToolEnv } from "@/config/env.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import type { Plantilla, TipoPlantilla } from "@/domain/types/plantilla-caso.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { crearBitacora } from "@/infra/bitacora.ts";
import {
  esquemaPlantillaCampos,
  esquemaPlantillaCeldas,
  esquemaSolicitud,
  esquemaSoportesExigidos,
} from "@/infra/fixtures/esquemas.ts";
import {
  directorioSoportes,
  existeArchivo,
  leerGlosario,
  leerIndiceSoportes,
  leerJsonValidado,
  leerMaestro,
  resolverRaiz,
  rutaEnCaso,
  soportesPresentes,
} from "@/infra/fixtures/lector.ts";
import { cargarPlantillaTexto } from "@/infra/knowledge/plantillas.ts";
import { cargarReglas, DIRECTORIO_CONOCIMIENTO_POR_DEFECTO } from "@/infra/knowledge/reglas.ts";
import { relojFijo, relojSistema } from "@/infra/reloj.ts";
import {
  escribirArchivoSalida,
  escribirBinarioSalida,
  limpiarArtefactosPrevios,
  listarPaquete,
  reiniciarPaquete,
  rutaEnPaquete,
} from "@/infra/salida/archivos.ts";
import { copiarAlPaquete } from "@/infra/salida/copias.ts";
import { conCandadoCaso } from "@/infra/salida/mutex.ts";
import { renderizarPdf } from "@/infra/salida/pdf/render.ts";
import { directorioSalidaCaso, listarCasos, resolverCaso } from "@/infra/salida/rutas-seguras.ts";
import { escribirXlsx } from "@/infra/salida/xlsx.ts";
import { formatearIssues } from "@/tools/issues.ts";

export type OpcionesEntorno = { readonly directorioConocimiento?: string };

export type ContextoNormalizado = { readonly directorio: string; readonly sesion: string };

export type EntornoEjecucion = {
  readonly registrar: Registrar;
  readonly entorno: Resultado<Entorno>;
};

async function leerPlantilla(directorioCaso: string, tipo: TipoPlantilla): Promise<Lectura<Plantilla>> {
  const archivo = ARCHIVO_PLANTILLA[tipo];
  const ruta = rutaEnCaso(directorioCaso, archivo);
  if (tipo === TIPO_PLANTILLA.CELDAS) {
    const lectura = await leerJsonValidado(ruta, esquemaPlantillaCeldas);
    return lectura.estado === ESTADO_LECTURA.OK
      ? { estado: ESTADO_LECTURA.OK, valor: { tipo, archivo, campos: lectura.valor } }
      : lectura;
  }
  const lectura = await leerJsonValidado(ruta, esquemaPlantillaCampos);
  return lectura.estado === ESTADO_LECTURA.OK
    ? { estado: ESTADO_LECTURA.OK, valor: { tipo, archivo, campos: lectura.valor } }
    : lectura;
}

function copiar(raiz: string, caso: string, origen: OrigenCopia): Promise<string> {
  if (origen.tipo === ORIGEN_COPIA.SOPORTE) {
    return copiarAlPaquete(raiz, caso, rutaEnCaso(directorioSoportes(raiz), origen.archivo), origen.archivo);
  }
  const nombre = origen.archivo;
  return copiarAlPaquete(raiz, caso, rutaEnCaso(directorioSalidaCaso(raiz, caso), nombre), nombre);
}

function relojDe(config: ToolEnv): Reloj {
  return config.FECHA_EJECUCION === undefined
    ? relojSistema(config.TZ_NEGOCIO)
    : relojFijo(config.FECHA_EJECUCION);
}

function entornoDeFixtures(raiz: string, reloj: Reloj, directorioConocimiento: string): Entorno {
  return {
    raiz,
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
      escribir: (caso, archivo, contenido) => escribirArchivoSalida(raiz, caso, archivo, contenido),
      escribirEnPaquete: (caso, archivo, contenido) =>
        escribirArchivoSalida(raiz, caso, rutaEnPaquete(archivo), contenido),
      binario: (caso, archivo, bytes) => escribirBinarioSalida(raiz, caso, archivo, bytes),
      limpiarPrevios: (caso) => limpiarArtefactosPrevios(raiz, caso),
      existe: (caso, archivo) => existeArchivo(rutaEnCaso(directorioSalidaCaso(raiz, caso), archivo)),
      existeEnPaquete: (caso, archivo) =>
        existeArchivo(rutaEnCaso(directorioSalidaCaso(raiz, caso), rutaEnPaquete(archivo))),
      reiniciarPaquete: (caso) => reiniciarPaquete(raiz, caso),
      listarPaquete: (caso) => listarPaquete(raiz, caso),
      copiar: (caso, origen) => copiar(raiz, caso, origen),
    },
    soportes: {
      indice: () => leerIndiceSoportes(raiz),
      presentes: () => soportesPresentes(raiz),
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
  const config = readToolEnv();
  if (!config.success) {
    return {
      registrar: crearBitacora(raiz, relojSistema(ZONA_HORARIA_POR_DEFECTO)),
      entorno: fallo(CODIGO_ERROR.CONFIGURACION_INVALIDA, { detalle: formatearIssues(config.error.issues) }),
    };
  }
  const reloj = relojDe(config.data);
  const directorioConocimiento = opciones.directorioConocimiento ?? DIRECTORIO_CONOCIMIENTO_POR_DEFECTO;
  return {
    registrar: crearBitacora(raiz, reloj),
    entorno: exito(entornoDeFixtures(raiz, reloj, directorioConocimiento)),
  };
}
