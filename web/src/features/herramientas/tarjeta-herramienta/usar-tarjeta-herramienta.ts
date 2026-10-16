import { ESTADO_HERRAMIENTA } from "@web/config/constants/ui.constants.ts";
import { TEXTO_HERRAMIENTA } from "@web/config/strings.ts";
import { argumentosLegibles } from "@web/features/chat/estado/conversacion.ts";
import type { LlamadaDelTurno } from "@web/types/chat.type.ts";
import type { ControlTarjetaHerramienta } from "@web/types/ui.type.ts";

export function controlTarjetaHerramienta(llamada: LlamadaDelTurno): ControlTarjetaHerramienta {
  const fallida = llamada.estado === ESTADO_HERRAMIENTA.ERROR;
  return {
    argumentos: argumentosLegibles(llamada.argumentos),
    resumen: llamada.resumen ?? "",
    resultado: llamada.resumen ?? TEXTO_HERRAMIENTA.sinResultado,
    codigoVisible: fallida && llamada.codigo !== null ? TEXTO_HERRAMIENTA.codigo(llamada.codigo) : null,
  };
}
