export const LIMITES_XLSX = {
  nombreHoja: 31,
  columnas: 16_384,
  filas: 1_048_576,
} as const;

export const HOJA_RESERVADA_XLSX = "history";

export const MARCAS_XLSX = {
  rellenoFaltante: "FFFFC7CE",
  rellenoPorConfirmar: "FFFFEB9C",
  notaFaltante: "Faltante: no existe en el maestro",
} as const;
