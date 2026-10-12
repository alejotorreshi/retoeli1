export type Formato = "xlsx" | "pdf" | "portal";

export type FechaISO = `${number}-${number}-${number}`;

export type Solicitud = {
  readonly id: string;
  readonly de: string;
  readonly para: string;
  readonly asunto: string;
  readonly fecha: string;
  readonly pais: string;
  readonly cliente: string;
  readonly formato: Formato;
  readonly cuerpo: string;
  readonly adjuntos: readonly string[];
};

export type CampoCelda = {
  readonly hoja: string;
  readonly celda_etiqueta: string;
  readonly etiqueta: string;
  readonly celda_valor: string;
};

export type CampoLista = {
  readonly etiqueta: string;
  readonly obligatorio: boolean;
};

export type TipoPlantilla = "celdas" | "campos";

export type Plantilla =
  | { readonly tipo: "celdas"; readonly archivo: string; readonly campos: readonly CampoCelda[] }
  | { readonly tipo: "campos"; readonly archivo: string; readonly campos: readonly CampoLista[] };

export type CampoSolicitado = {
  readonly etiqueta: string;
  readonly obligatorio: boolean | null;
};
