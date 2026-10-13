export type ProyectoTemporal = {
  readonly raiz: string;
  readonly casosDir: string;
  limpiar(): Promise<void>;
};

export type OpcionesProyecto = { readonly sinteticos?: readonly string[] };

export type ConocimientoTemporal = {
  readonly directorio: string;
  limpiar(): Promise<void>;
};
