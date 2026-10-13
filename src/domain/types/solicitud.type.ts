import type { FORMATO } from "@/config/constants/forms.constants.ts";
import type { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { TipoPlantilla } from "@/domain/types/plantilla-caso.type.ts";

export type PlantillasPresentes = Readonly<Record<TipoPlantilla, boolean>>;

export type CampoAmbiguo = {
  readonly etiqueta: string;
  readonly estado: typeof ESTADO_CAMPO.REQUIERE_CONFIRMACION;
  readonly propuesta: string | null;
};

export type Formato = ValorDe<typeof FORMATO>;

export type Solicitud = {
  readonly id: string;
  readonly de: string;
  readonly para: string;
  readonly asunto: string;
  readonly fecha: string;
  readonly pais: string;
  readonly cliente: string;
  readonly formato: Formato;
  readonly cuerpo: string;
  readonly adjuntos: readonly string[];
};

export type CampoSolicitado = {
  readonly etiqueta: string;
  readonly obligatorio: boolean | null;
};
