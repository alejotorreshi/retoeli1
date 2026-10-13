import type { DestinoBitacora } from "@/application/types/puertos-agente.type.ts";

export type LineaLog = Readonly<Record<string, unknown>> & { readonly msg: string; readonly level: string };

export type CapturaLogs = {
  readonly destino: DestinoBitacora;
  readonly crudas: string[];
  lineas(): LineaLog[];
};
