import type { Entorno, Lectura, OrigenCopia, Reloj } from "@/application/types/puertos.type.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVO_PLANTILLA, ARCHIVOS_CASO } from "@/config/constants/files.constants.ts";
import { TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import { ESTADO_LECTURA, ORIGEN_COPIA } from "@/config/constants/io.constants.ts";
import { ZONA_HORARIA_POR_DEFECTO } from "@/config/constants/runtime.constants.ts";
import { readToolEnv, type ToolEnv } from "@/config/env.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import type { Plantilla, TipoPlantilla } from "@/domain/types/plantilla-caso.type.ts";
import { fixedClock, systemClock } from "@/infra/clock/clock.adapter.ts";
import { listCases, resolveCase } from "@/infra/fixtures/case-resolver.adapter.ts";
import {
  fileExists,
  pathInCase,
  presentSupports,
  readGlossary,
  readMaster,
  readSupportIndex,
  readValidatedJson,
  resolveRoot,
  supportsDirectory,
} from "@/infra/fixtures/fixtures-reader.adapter.ts";
import {
  cellTemplateSchema,
  fieldTemplateSchema,
  requestSchema,
  requiredSupportsSchema,
} from "@/infra/fixtures/schemas/fixtures.schema.ts";
import { caseOutputDirectory } from "@/infra/fs/safe-paths.util.ts";
import { DEFAULT_KNOWLEDGE_DIRECTORY, loadRules } from "@/infra/knowledge/rules-loader.adapter.ts";
import { loadKnowledgeTemplate } from "@/infra/knowledge/template-loader.adapter.ts";
import { createAuditLog } from "@/infra/logging/audit-log.adapter.ts";
import { withCaseLock } from "@/infra/output/case-lock.adapter.ts";
import {
  clearPreviousArtifacts,
  listPackage,
  packagePath,
  resetPackage,
  writeOutputBinary,
  writeOutputFile,
} from "@/infra/output/output-files.adapter.ts";
import { copyIntoPackage } from "@/infra/output/package-copy.adapter.ts";
import { renderPdf } from "@/infra/output/pdf/pdf-renderer.adapter.ts";
import { writeXlsx } from "@/infra/output/xlsx-writer.adapter.ts";
import { formatearIssues } from "@/tools/formatear-issues.util.ts";
import type { ContextoNormalizado, EntornoEjecucion, OpcionesEntorno } from "@/tools/types/entorno.type.ts";

async function leerPlantilla(directorioCaso: string, tipo: TipoPlantilla): Promise<Lectura<Plantilla>> {
  const archivo = ARCHIVO_PLANTILLA[tipo];
  const ruta = pathInCase(directorioCaso, archivo);
  if (tipo === TIPO_PLANTILLA.CELDAS) {
    const lectura = await readValidatedJson(ruta, cellTemplateSchema);
    return lectura.estado === ESTADO_LECTURA.OK
      ? { estado: ESTADO_LECTURA.OK, valor: { tipo, archivo, campos: lectura.valor } }
      : lectura;
  }
  const lectura = await readValidatedJson(ruta, fieldTemplateSchema);
  return lectura.estado === ESTADO_LECTURA.OK
    ? { estado: ESTADO_LECTURA.OK, valor: { tipo, archivo, campos: lectura.valor } }
    : lectura;
}

function copiar(raiz: string, caso: string, origen: OrigenCopia): Promise<string> {
  if (origen.tipo === ORIGEN_COPIA.SOPORTE) {
    return copyIntoPackage(raiz, caso, pathInCase(supportsDirectory(raiz), origen.archivo), origen.archivo);
  }
  const nombre = origen.archivo;
  return copyIntoPackage(raiz, caso, pathInCase(caseOutputDirectory(raiz, caso), nombre), nombre);
}

function relojDe(config: ToolEnv): Reloj {
  return config.FECHA_EJECUCION === undefined
    ? systemClock(config.TZ_NEGOCIO)
    : fixedClock(config.FECHA_EJECUCION);
}

function entornoDeFixtures(raiz: string, reloj: Reloj, directorioConocimiento: string): Entorno {
  return {
    raiz,
    reloj,
    casos: {
      resolver: (caso) => resolveCase(raiz, caso),
      disponibles: () => listCases(raiz),
    },
    fixtures: {
      leerSolicitud: (directorio) =>
        readValidatedJson(pathInCase(directorio, ARCHIVOS_CASO.solicitud), requestSchema),
      leerSoportesExigidos: (directorio) =>
        readValidatedJson(pathInCase(directorio, ARCHIVOS_CASO.soportesExigidos), requiredSupportsSchema),
      existePlantilla: (directorio, tipo) => fileExists(pathInCase(directorio, ARCHIVO_PLANTILLA[tipo])),
      leerPlantilla,
    },
    salida: {
      escribir: (caso, archivo, contenido) => writeOutputFile(raiz, caso, archivo, contenido),
      escribirEnPaquete: (caso, archivo, contenido) =>
        writeOutputFile(raiz, caso, packagePath(archivo), contenido),
      binario: (caso, archivo, bytes) => writeOutputBinary(raiz, caso, archivo, bytes),
      limpiarPrevios: (caso) => clearPreviousArtifacts(raiz, caso),
      existe: (caso, archivo) => fileExists(pathInCase(caseOutputDirectory(raiz, caso), archivo)),
      existeEnPaquete: (caso, archivo) =>
        fileExists(pathInCase(caseOutputDirectory(raiz, caso), packagePath(archivo))),
      reiniciarPaquete: (caso) => resetPackage(raiz, caso),
      listarPaquete: (caso) => listPackage(raiz, caso),
      copiar: (caso, origen) => copiar(raiz, caso, origen),
    },
    soportes: {
      indice: () => readSupportIndex(raiz),
      presentes: () => presentSupports(raiz),
    },
    formularios: { xlsx: writeXlsx, pdf: renderPdf },
    plantillas: {
      cargar: (reglas, clave) => loadKnowledgeTemplate(directorioConocimiento, reglas, clave),
    },
    candado: (caso, seccion) => withCaseLock(caseOutputDirectory(raiz, caso), seccion),
    reglas: () => loadRules(directorioConocimiento),
    maestro: () => readMaster(raiz),
    glosario: () => readGlossary(raiz),
  };
}

export function crearEntorno(
  contexto: ContextoNormalizado,
  opciones: OpcionesEntorno = {},
): EntornoEjecucion {
  const raiz = resolveRoot(contexto.directorio);
  const config = readToolEnv();
  if (!config.success) {
    return {
      registrar: createAuditLog(raiz, systemClock(ZONA_HORARIA_POR_DEFECTO)),
      entorno: fallo(CODIGO_ERROR.CONFIGURACION_INVALIDA, { detalle: formatearIssues(config.error.issues) }),
    };
  }
  const reloj = relojDe(config.data);
  const directorioConocimiento = opciones.directorioConocimiento ?? DEFAULT_KNOWLEDGE_DIRECTORY;
  return {
    registrar: createAuditLog(raiz, reloj),
    entorno: exito(entornoDeFixtures(raiz, reloj, directorioConocimiento)),
  };
}
