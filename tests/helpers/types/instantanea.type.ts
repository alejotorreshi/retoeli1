export type LineaBitacora = Record<string, unknown>;

export type CeldaComparable = {
  readonly hoja: string;
  readonly celda: string;
  readonly valor: unknown;
  readonly tipo: string;
  readonly relleno: string | null;
  readonly nota: string | null;
};

export type ValorComparable =
  | { readonly tipo: "bytes"; readonly bytes: Uint8Array }
  | { readonly tipo: "jsonl"; readonly lineas: readonly LineaBitacora[] }
  | { readonly tipo: "xlsx"; readonly hojas: readonly string[]; readonly celdas: readonly CeldaComparable[] };

export type Instantanea = ReadonlyMap<string, ValorComparable>;
