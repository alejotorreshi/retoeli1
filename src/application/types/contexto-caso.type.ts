import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { IndiceGlosario } from "@/domain/types/mapeo.type.ts";
import type { PlantillaCaso } from "@/domain/types/plantilla-caso.type.ts";
import type { Reglas } from "@/domain/types/reglas.type.ts";
import type { Solicitud } from "@/domain/types/solicitud.type.ts";

export type SolicitudCaso = {
  readonly caso: string;
  readonly solicitud: Solicitud;
  readonly soportesExigidos: readonly string[];
  readonly plantilla: PlantillaCaso;
};

export type ContextoCaso = SolicitudCaso & {
  readonly maestro: Maestro;
  readonly indice: IndiceGlosario;
  readonly reglas: Reglas;
};
