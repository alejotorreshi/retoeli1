export type TipoCelda = "vacia" | "texto" | "numero" | "formula" | "otro";

export type CeldaLeida = {
  readonly hoja: string;
  readonly celda: string;
  readonly valor: unknown;
  readonly tipo: TipoCelda;
  readonly formato: string | null;
  readonly relleno: string | null;
  readonly nota: string | null;
  readonly negrita: boolean;
};

export type MetadatosXlsx = {
  readonly hojas: readonly string[];
  readonly creador: string;
  readonly modificadoPor: string;
  readonly creado: string;
  readonly modificado: string;
};
