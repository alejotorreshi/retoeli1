export const REGLAS_MAPEO = [
  "glosario_exacto",
  "glosario_normalizado",
  "clave_directa",
  "regla_pais",
  "etiqueta_generica",
  "sin_fuente",
] as const;

export type ReglaMapeo = (typeof REGLAS_MAPEO)[number];

export type EstadoCampo = "lleno" | "faltante" | "requiere_confirmacion";

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

export type Reglas = {
  readonly version: number;
  readonly confianza: EscalaConfianza;
  readonly identificador_tributario: IdentificadorTributario;
  readonly etiquetas_genericas: readonly string[];
  readonly notas_contexto: readonly NotaContexto[];
  readonly soportes: ReglasSoportes;
  readonly plantillas: RutasPlantillas;
};
