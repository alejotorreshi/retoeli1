import type {
  APLICA_NOTA,
  ESTADO_CAMPO,
  REGLA_MAPEO,
  VARIABLE_NOTA,
} from "@/config/constants/mapping.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
export type ReglaMapeo = ValorDe<typeof REGLA_MAPEO>;

export type EstadoCampo = ValorDe<typeof ESTADO_CAMPO>;

export type VariableNota = ValorDe<typeof VARIABLE_NOTA>;

export type AplicaNota = ValorDe<typeof APLICA_NOTA>;

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
