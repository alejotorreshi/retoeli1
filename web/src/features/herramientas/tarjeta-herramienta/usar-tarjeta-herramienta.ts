import { ESTADO_HERRAMIENTA } from "@web/config/constants/ui.constants.ts";
import { argumentosLegibles } from "@web/features/chat/estado/conversacion.ts";
import type { LlamadaDelTurno } from "@web/types/chat.type.ts";
import type { ControlTarjetaHerramienta } from "@web/types/ui.type.ts";

export function useTarjetaHerramienta(llamada: LlamadaDelTurno): ControlTarjetaHerramienta {
  return {
    fallida: llamada.estado === ESTADO_HERRAMIENTA.ERROR,
    argumentos: argumentosLegibles(llamada.argumentos),
  };
}
