import { TEXTO_ACCIONES, TEXTO_TARJETA_CASO } from "@web/config/strings.ts";
import { datosDeTarjetaCaso } from "@web/features/chat/estado/tarjeta-caso.ts";
import { seleccionarEnvioDeshabilitado } from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlTarjetaCaso, PaisDeTarjeta } from "@web/types/ui.type.ts";

function paisDe(codigo: string | null, nombre: string | null): PaisDeTarjeta | null {
  return codigo === null || nombre === null ? null : { codigo, nombre };
}

export function useTarjetaCaso(slug: string): ControlTarjetaCaso {
  const deshabilitada = useSeleccion(seleccionarEnvioDeshabilitado);
  const { enviarTexto } = useAcciones();
  const datos = datosDeTarjetaCaso(slug);
  const pais = paisDe(datos.codigo, datos.nombrePais);
  return {
    slug,
    cliente: datos.cliente,
    pais,
    etiqueta:
      pais === null
        ? TEXTO_TARJETA_CASO.etiquetaSoloSlug(slug)
        : TEXTO_TARJETA_CASO.etiqueta(datos.cliente, pais.nombre, slug),
    deshabilitada,
    alProcesar: () => enviarTexto(TEXTO_ACCIONES.mensajeDemoDe(slug)),
  };
}
