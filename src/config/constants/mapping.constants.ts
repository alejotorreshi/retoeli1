import type { ValorDe } from "@/config/types/valor-de.type.ts";

export const ESTADO_CAMPO = {
  LLENO: "lleno",
  FALTANTE: "faltante",
  REQUIERE_CONFIRMACION: "requiere_confirmacion",
} as const;

export const REGLA_MAPEO = {
  GLOSARIO_EXACTO: "glosario_exacto",
  GLOSARIO_NORMALIZADO: "glosario_normalizado",
  CLAVE_DIRECTA: "clave_directa",
  REGLA_PAIS: "regla_pais",
  ETIQUETA_GENERICA: "etiqueta_generica",
  SIN_FUENTE: "sin_fuente",
} as const;

export const REGLAS_SIEMPRE_POR_CONFIRMAR: ReadonlySet<ValorDe<typeof REGLA_MAPEO>> = new Set([
  REGLA_MAPEO.REGLA_PAIS,
  REGLA_MAPEO.ETIQUETA_GENERICA,
]);

export const TIPO_HOJA_MAESTRO = {
  TEXTO: "texto",
  NO_TEXTUAL: "no_textual",
  AUSENTE: "ausente",
} as const;

export const APLICA_NOTA = {
  SIEMPRE: "siempre",
  EXTRANJERO: "extranjero",
} as const;

export const VARIABLE_NOTA = {
  MONEDA: "moneda",
  ANO: "ano",
  PAIS: "pais",
  IDENTIFICADOR: "identificador",
  PAIS_EMISOR: "pais_emisor",
} as const;

export const VARIABLES_NOTA_CAMPO = [
  VARIABLE_NOTA.MONEDA,
  VARIABLE_NOTA.ANO,
  VARIABLE_NOTA.PAIS,
  VARIABLE_NOTA.IDENTIFICADOR,
] as const;

export const VARIABLES_AVISO_SOPORTE = [VARIABLE_NOTA.PAIS_EMISOR] as const;

export const VARIABLES_NOTA_PERMITIDAS = [...VARIABLES_NOTA_CAMPO, ...VARIABLES_AVISO_SOPORTE] as const;

export const NOMBRE_TEXTO_REGLA = {
  NOTA_EXTRANJERO: "identificador_tributario.nota_extranjero",
  NOTA_GENERICA: "identificador_tributario.nota_generica",
  NOTAS_CONTEXTO: "notas_contexto",
  AVISO_EMISOR: "soportes.aviso_emisor_distinto",
} as const;

export const CLAVES_PROHIBIDAS: ReadonlySet<string> = new Set(["__proto__", "constructor", "prototype"]);

export const VALOR_DE_MUESTRA = "x";
