import {
  seleccionarEnvioDeshabilitado,
  seleccionarMarcasDeArchivos,
  seleccionarProgresos,
} from "@web/store/selectores.ts";
import { useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlPanelCasos } from "@web/types/ui.type.ts";
import { useId } from "react";

export function usePanelCasos(): ControlPanelCasos {
  const progresos = useSeleccion(seleccionarProgresos);
  const marcas = useSeleccion(seleccionarMarcasDeArchivos);
  const envioDeshabilitado = useSeleccion(seleccionarEnvioDeshabilitado);
  const idTitulo = useId();
  return {
    idTitulo,
    bloques: progresos.map((progreso, indice) => ({
      progreso,
      reciente: indice === 0,
      marca: marcas.get(progreso.caso) ?? 0,
      envioDeshabilitado,
    })),
  };
}
