import { TEXTO_ACCIONES, TEXTO_TARJETA_CASO } from "@web/config/strings.ts";
import { datosDeTarjetaCaso } from "@web/features/chat/estado/tarjeta-caso.ts";
import { seleccionarEnvioDeshabilitado } from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlTarjetaCaso } from "@web/types/ui.type.ts";

export function useTarjetaCaso(slug: string): ControlTarjetaCaso {
  const deshabilitada = useSeleccion(seleccionarEnvioDeshabilitado);
  const { enviarTexto } = useAcciones();
  const { cliente, pais } = datosDeTarjetaCaso(slug);
  return {
    cliente,
    pais,
    etiqueta:
      pais === null
        ? TEXTO_TARJETA_CASO.etiquetaSoloSlug(slug)
        : TEXTO_TARJETA_CASO.etiqueta(cliente, pais.nombre, slug),
    deshabilitada,
    alProcesar: () => enviarTexto(TEXTO_ACCIONES.mensajeDemoDe(slug)),
  };
}
