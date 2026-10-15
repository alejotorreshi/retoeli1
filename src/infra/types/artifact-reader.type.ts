import type { TipoArchivo } from "@/application/types/artefactos.type.ts";
import type { EstadoCampo } from "@/domain/types/reglas.type.ts";

export type ArtifactEntry = {
  readonly name: string;
  readonly file: string;
  readonly inPackage: boolean;
  readonly tipo: TipoArchivo;
};

export type ArtifactDirectories = {
  readonly caseDirectory: string;
  readonly packageDirectory: string | null;
};

export type ServableArtifact = {
  readonly entry: ArtifactEntry;
  readonly realPath: string;
};

export type SavedField = {
  readonly etiqueta: string;
  readonly estado: EstadoCampo;
  readonly valor_enmascarado: string | null;
  readonly nota: string | null;
};

export type MapeoGuardado = {
  readonly campos: readonly SavedField[];
};
