import { ORDEN_PESTANAS, TECLA_PESTANA } from "@web/config/constants/ui.constants.ts";
import type { Pestana } from "@web/types/ui.type.ts";

export function pestanaPorTecla(tecla: string, actual: Pestana): Pestana | null {
  const indice = ORDEN_PESTANAS.indexOf(actual);
  const total = ORDEN_PESTANAS.length;
  switch (tecla) {
    case TECLA_PESTANA.ANTERIOR:
      return ORDEN_PESTANAS[(indice - 1 + total) % total] ?? null;
    case TECLA_PESTANA.SIGUIENTE:
      return ORDEN_PESTANAS[(indice + 1) % total] ?? null;
    case TECLA_PESTANA.PRIMERA:
      return ORDEN_PESTANAS[0];
    case TECLA_PESTANA.ULTIMA:
      return ORDEN_PESTANAS[total - 1] ?? null;
    default:
      return null;
  }
}
