export const LIMITES_XLSX = {
  nombreHoja: 31,
  columnas: 16_384,
  filas: 1_048_576,
} as const;

export const HOJA_RESERVADA_XLSX = "history";

export const RELLENO_XLSX = {
  FALTANTE: "FFFFC7CE",
  POR_CONFIRMAR: "FFFFEB9C",
} as const;

export const FORMATO_CELDA_TEXTO = "@";

export const LETRAS_DEL_ALFABETO = 26;

export const CODIGO_ANTES_DE_A = 64;

export const ANCHO_COLUMNA_XLSX = {
  minimo: 10,
  maximo: 60,
  margen: 2,
} as const;
