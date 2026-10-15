import type { FORMATO } from "@/config/constants/forms.constants.ts";
import type { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import type { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type ConteoVisible = Readonly<Record<ValorDe<typeof ESTADO_CAMPO>, number>>;

export type ResultadoVisible = {
  readonly herramienta: ValorDe<typeof HERRAMIENTA>;
  readonly pais: string | null;
  readonly formato: ValorDe<typeof FORMATO> | null;
  readonly conteo: ConteoVisible | null;
  readonly listoParaFirma: boolean | null;
  readonly bloqueosLegibles: readonly string[] | null;
  readonly ruta: string | null;
  readonly aviso: string | null;
};
