import type { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type LlamadaResumida = {
  readonly herramienta: ValorDe<typeof HERRAMIENTA>;
  readonly caso: string | null;
  readonly ok: boolean;
  readonly resumen: string | null;
};
