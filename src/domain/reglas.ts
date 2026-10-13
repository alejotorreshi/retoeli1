export const REGLAS_MAPEO = [
  "glosario_exacto",
  "glosario_normalizado",
  "clave_directa",
  "regla_pais",
  "etiqueta_generica",
  "sin_fuente",
] as const;

export type ReglaMapeo = (typeof REGLAS_MAPEO)[number];

export const ESTADOS_CAMPO = ["lleno", "faltante", "requiere_confirmacion"] as const;

export type EstadoCampo = (typeof ESTADOS_CAMPO)[number];

export const REGLAS_SIEMPRE_POR_CONFIRMAR: ReadonlySet<ReglaMapeo> = new Set([
  "regla_pais",
  "etiqueta_generica",
]);

export const VARIABLES_NOTA_CAMPO = ["moneda", "ano", "pais", "identificador"] as const;

export const VARIABLES_AVISO_SOPORTE = ["pais_emisor"] as const;

export const VARIABLES_NOTA_PERMITIDAS = [...VARIABLES_NOTA_CAMPO, ...VARIABLES_AVISO_SOPORTE] as const;

export type VariableNota = (typeof VARIABLES_NOTA_PERMITIDAS)[number];

export const VARIABLES_NOTA_DEL_MAESTRO: readonly (readonly [VariableNota, string])[] = [
  ["moneda", "ingresos_ultimo_ano.moneda"],
  ["ano", "ingresos_ultimo_ano.ano"],
];

export const APLICACIONES_NOTA = ["siempre", "extranjero"] as const;

export type AplicaNota = (typeof APLICACIONES_NOTA)[number];

export type EscalaConfianza = Readonly<Record<ReglaMapeo, number>> & { readonly umbral: number };

export type IdentificadorTributario = {
  readonly ruta: string;
  readonly pais_origen: string;
  readonly por_pais: Readonly<Record<string, string>>;
  readonly nota_extranjero: string;
  readonly nota_generica: string;
};

export type NotaContexto = {
  readonly ruta: string;
  readonly aplica: AplicaNota;
  readonly texto: string;
};

export type ReglasSoportes = {
  readonly dias_aviso_vencimiento: number;
  readonly aviso_emisor_distinto: string;
};

export type RutasPlantillas = {
  readonly checklist: string;
  readonly borrador_correo: string;
  readonly envio_simulado: string;
  readonly valores_portal: string;
};

export type ClavePlantilla = keyof RutasPlantillas;

export type Reglas = {
  readonly version: number;
  readonly confianza: EscalaConfianza;
  readonly identificador_tributario: IdentificadorTributario;
  readonly etiquetas_genericas: readonly string[];
  readonly notas_contexto: readonly NotaContexto[];
  readonly soportes: ReglasSoportes;
  readonly plantillas: RutasPlantillas;
};
