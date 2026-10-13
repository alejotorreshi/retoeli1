export const LONGITUD_MAXIMA_CASO = 64;
export const LONGITUD_MAXIMA_SESION = 128;
export const LIMITE_LECTURA_BYTES = 1_048_576;
export const MAX_ISSUES_ARGS = 5;

export const LIMITES_REGLAS = {
  texto: 500,
  etiqueta: 200,
  identificador: 20,
  elementos: 200,
  diasAvisoMaximo: 365,
} as const;

export const LIMITES_ARGS = {
  etiqueta: 200,
  elementos: 200,
} as const;

export const LIMITES_FIXTURES = {
  camposPlantilla: 500,
  etiqueta: 200,
  textoMaestro: 2_000,
  textoCorto: 500,
  cuerpo: 20_000,
  adjuntos: 50,
  soportes: 50,
} as const;
