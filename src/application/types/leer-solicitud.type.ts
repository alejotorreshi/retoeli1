import type { CampoAmbiguo, CampoSolicitado, Formato } from "@/domain/types/solicitud.type.ts";

export type ArgsLeerSolicitud = { readonly caso: string };

export type DatosSolicitud = {
  readonly caso: string;
  readonly pais: string;
  readonly cliente: string;
  readonly formato: Formato;
  readonly plantilla: string;
  readonly campos: readonly CampoSolicitado[];
  readonly ambiguos: readonly CampoAmbiguo[];
  readonly soportes: readonly string[];
};
