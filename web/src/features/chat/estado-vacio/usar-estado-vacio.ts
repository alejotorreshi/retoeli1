import { seleccionarCasos } from "@web/store/selectores.ts";
import { useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlEstadoVacio } from "@web/types/ui.type.ts";

export function useEstadoVacio(): ControlEstadoVacio {
  return { casos: useSeleccion(seleccionarCasos) };
}
