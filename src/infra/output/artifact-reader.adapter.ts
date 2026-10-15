import { lstat, readdir, realpath } from "node:fs/promises";
import { join } from "node:path";
import type {
  ArchivoCaso,
  ArchivoServible,
  LectorArtefactos,
  ResultadoVistaPrevia,
  TipoArchivo,
  VistaPrevia,
} from "@/application/types/artefactos.type.ts";
import {
  ARCHIVOS_PAQUETE,
  ARCHIVOS_SALIDA,
  ARCHIVOS_SISTEMA_IGNORADOS,
  PREFIJO_PAQUETE,
  RESULTADO_VISTA_PREVIA,
  SEPARADOR_EXTENSION,
  TIPO_ARCHIVO_CASO,
  TIPO_CONTENIDO_BINARIO,
  TIPO_CONTENIDO_POR_EXTENSION,
  TIPO_VISTA_PREVIA,
} from "@/config/constants/files.constants.ts";
import { PATRON_CASO } from "@/config/constants/patterns.constants.ts";
import { parsearJson } from "@/domain/utils/json.util.ts";
import { listCases } from "@/infra/fixtures/case-resolver.adapter.ts";
import { isNotFound, readOwnRegularText } from "@/infra/fs/fs.util.ts";
import { existingRealCaseDirectory, isInside, realPackageDirectory } from "@/infra/fs/safe-paths.util.ts";
import { esCopiaDeSoporte } from "@/infra/output/package-copy.adapter.ts";
import { mapeoGuardadoSchema } from "@/infra/output/schemas/mapeo-guardado.schema.ts";
import type {
  ArtifactDirectories,
  ArtifactEntry,
  ServableArtifact,
} from "@/infra/types/artifact-reader.type.ts";

function caseEntry(file: string, tipo: TipoArchivo): ArtifactEntry {
  return { name: file, file, inPackage: false, tipo };
}

function packageEntry(file: string, tipo: TipoArchivo): ArtifactEntry {
  return { name: `${PREFIJO_PAQUETE}${file}`, file, inPackage: true, tipo };
}

const FIXED_ENTRIES: readonly ArtifactEntry[] = [
  caseEntry(ARCHIVOS_SALIDA.FORMULARIO_XLSX, TIPO_ARCHIVO_CASO.FORMULARIO),
  caseEntry(ARCHIVOS_SALIDA.FORMULARIO_PDF, TIPO_ARCHIVO_CASO.FORMULARIO),
  caseEntry(ARCHIVOS_SALIDA.VALORES_PORTAL, TIPO_ARCHIVO_CASO.VALORES_PORTAL),
  packageEntry(ARCHIVOS_PAQUETE.CHECKLIST, TIPO_ARCHIVO_CASO.CHECKLIST),
  packageEntry(ARCHIVOS_PAQUETE.BORRADOR_CORREO, TIPO_ARCHIVO_CASO.BORRADOR),
  caseEntry(ARCHIVOS_SALIDA.ENVIO_SIMULADO, TIPO_ARCHIVO_CASO.ENVIO_SIMULADO),
];

const TABLE_PREVIEW: ReadonlySet<TipoArchivo> = new Set([
  TIPO_ARCHIVO_CASO.FORMULARIO,
  TIPO_ARCHIVO_CASO.VALORES_PORTAL,
]);

const TEXT_PREVIEW: ReadonlySet<TipoArchivo> = new Set([
  TIPO_ARCHIVO_CASO.CHECKLIST,
  TIPO_ARCHIVO_CASO.BORRADOR,
  TIPO_ARCHIVO_CASO.ENVIO_SIMULADO,
]);

function isPreviewable(tipo: TipoArchivo): boolean {
  return TABLE_PREVIEW.has(tipo) || TEXT_PREVIEW.has(tipo);
}

function contentTypeOf(file: string): string {
  const extension = file.slice(file.lastIndexOf(SEPARADOR_EXTENSION) + 1).toLowerCase();
  return TIPO_CONTENIDO_POR_EXTENSION[extension] ?? TIPO_CONTENIDO_BINARIO;
}

async function isKnownCase(root: string, caso: string): Promise<boolean> {
  return PATRON_CASO.test(caso) && (await listCases(root)).includes(caso);
}

async function existingPackageDirectory(caseDirectory: string): Promise<string | null> {
  try {
    return await realPackageDirectory(caseDirectory);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

async function directoriesOf(root: string, caso: string): Promise<ArtifactDirectories | null> {
  const caseDirectory = await existingRealCaseDirectory(root, caso);
  if (caseDirectory === null) return null;
  return { caseDirectory, packageDirectory: await existingPackageDirectory(caseDirectory) };
}

async function supportEntries(packageDirectory: string | null): Promise<readonly ArtifactEntry[]> {
  if (packageDirectory === null) return [];
  const entries = await readdir(packageDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && !ARCHIVOS_SISTEMA_IGNORADOS.has(entry.name))
    .map((entry) => entry.name)
    .filter(esCopiaDeSoporte)
    .sort()
    .map((file) => packageEntry(file, TIPO_ARCHIVO_CASO.SOPORTE));
}

async function regularFileInside(directory: string, file: string): Promise<string | null> {
  const path = join(directory, file);
  try {
    if (!(await lstat(path)).isFile()) return null;
    const real = await realpath(path);
    return isInside(directory, real) ? real : null;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

async function resolveEntry(
  entry: ArtifactEntry,
  directories: ArtifactDirectories,
): Promise<ServableArtifact | null> {
  const directory = entry.inPackage ? directories.packageDirectory : directories.caseDirectory;
  if (directory === null) return null;
  const realPath = await regularFileInside(directory, entry.file);
  return realPath === null ? null : { entry, realPath };
}

async function servableArtifacts(root: string, caso: string): Promise<readonly ServableArtifact[] | null> {
  if (!(await isKnownCase(root, caso))) return null;
  const directories = await directoriesOf(root, caso);
  if (directories === null) return [];
  const entries = [...FIXED_ENTRIES, ...(await supportEntries(directories.packageDirectory))];
  const resolved = await Promise.all(entries.map((entry) => resolveEntry(entry, directories)));
  return resolved.filter((artifact): artifact is ServableArtifact => artifact !== null);
}

function toCaseFile({ entry }: ServableArtifact): ArchivoCaso {
  return { nombre: entry.name, tipo: entry.tipo, previsualizable: isPreviewable(entry.tipo) };
}

async function findArtifact(root: string, caso: string, nombre: string): Promise<ServableArtifact | null> {
  const artifacts = await servableArtifacts(root, caso);
  return artifacts?.find((artifact) => artifact.entry.name === nombre) ?? null;
}

async function tablePreview(root: string, caso: string): Promise<VistaPrevia | null> {
  const caseDirectory = await existingRealCaseDirectory(root, caso);
  if (caseDirectory === null) return null;
  const text = await readOwnRegularText(join(caseDirectory, ARCHIVOS_SALIDA.MAPEO));
  if (text === null) return null;
  const json = parsearJson(text);
  if (!json.ok) return null;
  const mapeo = mapeoGuardadoSchema.safeParse(json.valor);
  if (!mapeo.success) return null;
  const filas = mapeo.data.campos.map(({ etiqueta, valor_enmascarado, estado, nota }) => ({
    etiqueta,
    valor_enmascarado,
    estado,
    nota,
  }));
  return { tipo: TIPO_VISTA_PREVIA.TABLA, filas };
}

async function textPreview(realPath: string): Promise<VistaPrevia | null> {
  const texto = await readOwnRegularText(realPath);
  return texto === null ? null : { tipo: TIPO_VISTA_PREVIA.TEXTO, texto };
}

const PREVIEW_NOT_FOUND: ResultadoVistaPrevia = { estado: RESULTADO_VISTA_PREVIA.NO_ENCONTRADO };

const PREVIEW_UNAVAILABLE: ResultadoVistaPrevia = { estado: RESULTADO_VISTA_PREVIA.NO_DISPONIBLE };

async function previewOf(
  root: string,
  caso: string,
  artifact: ServableArtifact,
): Promise<VistaPrevia | null> {
  if (TABLE_PREVIEW.has(artifact.entry.tipo)) return tablePreview(root, caso);
  if (TEXT_PREVIEW.has(artifact.entry.tipo)) return textPreview(artifact.realPath);
  return null;
}

export function createArtifactReader(root: string): LectorArtefactos {
  return {
    async listar(caso: string): Promise<readonly ArchivoCaso[] | null> {
      const artifacts = await servableArtifacts(root, caso);
      return artifacts === null ? null : artifacts.map(toCaseFile);
    },
    async abrir(caso: string, nombre: string): Promise<ArchivoServible | null> {
      const artifact = await findArtifact(root, caso, nombre);
      if (artifact === null) return null;
      const tipoContenido = contentTypeOf(artifact.entry.file);
      return { nombre: artifact.entry.file, tipoContenido, cuerpo: Bun.file(artifact.realPath) };
    },
    async vistaPrevia(caso: string, nombre: string): Promise<ResultadoVistaPrevia> {
      const artifact = await findArtifact(root, caso, nombre);
      if (artifact === null) return PREVIEW_NOT_FOUND;
      const vista = await previewOf(root, caso, artifact);
      return vista === null ? PREVIEW_UNAVAILABLE : { estado: RESULTADO_VISTA_PREVIA.LISTA, vista };
    },
  };
}
