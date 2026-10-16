import { TEXTO_DISCO } from "@web/config/strings.ts";
import type { ControlAvisoDiscoEfimero, PropsAvisoDiscoEfimero } from "@web/types/ui.type.ts";

export function controlAvisoDiscoEfimero({
  caso,
  alProcesar,
}: PropsAvisoDiscoEfimero): ControlAvisoDiscoEfimero {
  function alProcesarDeNuevo(): void {
    alProcesar(TEXTO_DISCO.mensaje(caso));
  }

  return { alProcesarDeNuevo };
}
