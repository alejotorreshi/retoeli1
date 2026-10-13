import type { ESTADO_VIGENCIA } from "@/config/constants/supports.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type EstadoVigencia = ValorDe<typeof ESTADO_VIGENCIA>;

export type Vigencia = {
  readonly estado: EstadoVigencia;
  readonly dias_restantes: number | null;
  readonly aviso: string | null;
};
