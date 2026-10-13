export type CampoPortal = {
  readonly etiqueta: string;
  readonly valor: string;
  readonly estado: string;
  readonly nota: string;
};

export type DatosValoresPortal = {
  readonly caso: string;
  readonly cliente: string;
  readonly fecha_ejecucion: string;
  readonly aviso: string;
  readonly campos: readonly CampoPortal[];
  readonly pendientes: readonly CampoPortal[];
};

export type CasoPortal = { readonly caso: string; readonly cliente: string };
