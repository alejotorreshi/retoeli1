export type LineaLog = Readonly<Record<string, unknown>> & { readonly msg: string; readonly level: string };

export type CapturaLogs = {
  readonly destino: { write(linea: string): void };
  readonly crudas: string[];
  lineas(): LineaLog[];
};
