import type { TipoArchivo } from "@/application/types/artefactos.type.ts";

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
