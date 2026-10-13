export const ESTADO_LECTURA = {
  OK: "ok",
  NO_ENCONTRADO: "no_encontrado",
  INVALIDO: "invalido",
} as const;

export const ORIGEN_COPIA = {
  FORMULARIO: "formulario",
  SOPORTE: "soporte",
} as const;

export const LECTURA_NO_ENCONTRADA = { estado: ESTADO_LECTURA.NO_ENCONTRADO } as const;

export const LECTURA_INVALIDA = { estado: ESTADO_LECTURA.INVALIDO } as const;
