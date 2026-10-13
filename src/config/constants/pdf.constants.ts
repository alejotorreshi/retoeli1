export const COLOR_TRAZO = {
  TEXTO: "texto",
  FALTANTE: "faltante",
  POR_CONFIRMAR: "por_confirmar",
} as const;

export const DISENO_PDF = {
  ancho: 595,
  alto: 842,
  margen: 50,
  anchoEtiqueta: 190,
  separacionColumnas: 15,
  tamanoTexto: 10,
  tamanoTitulo: 12,
  interlineado: 14,
  separacionBloques: 6,
  colores: {
    [COLOR_TRAZO.TEXTO]: [0, 0, 0],
    [COLOR_TRAZO.FALTANTE]: [0.75, 0, 0],
    [COLOR_TRAZO.POR_CONFIRMAR]: [0.8, 0.5, 0],
  },
} as const;
