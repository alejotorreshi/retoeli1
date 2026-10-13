import type { DestinoBitacora } from "@/application/types/puertos-agente.type.ts";
import type { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type LoggerOptions = {
  readonly level: ValorDe<typeof NIVELES_LOG>;
  readonly destination?: DestinoBitacora;
  readonly secrets: readonly string[];
};
