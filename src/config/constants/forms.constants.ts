export const FORMATO = {
  XLSX: "xlsx",
  PDF: "pdf",
  PORTAL: "portal",
} as const;

export const TIPO_PLANTILLA = {
  CELDAS: "celdas",
  CAMPOS: "campos",
} as const;

export const PLANTILLA_DEL_FORMATO = {
  [FORMATO.XLSX]: TIPO_PLANTILLA.CELDAS,
  [FORMATO.PDF]: TIPO_PLANTILLA.CAMPOS,
  [FORMATO.PORTAL]: TIPO_PLANTILLA.CAMPOS,
} as const;
