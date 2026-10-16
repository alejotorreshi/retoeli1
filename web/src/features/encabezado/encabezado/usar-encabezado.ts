import { CLASE_GLOBAL } from "@web/config/constants/ui.constants.ts";
import { seleccionarEnCurso, seleccionarFechaEjecucion, seleccionarSalud } from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlEncabezado } from "@web/types/ui.type.ts";

function clasePrefijo(angosto: boolean): string | undefined {
  return angosto ? CLASE_GLOBAL.OCULTO : undefined;
}

export function useEncabezado(angosto: boolean): ControlEncabezado {
  const fechaEjecucion = useSeleccion(seleccionarFechaEjecucion);
  const salud = useSeleccion(seleccionarSalud);
  const nuevaSesionDeshabilitada = useSeleccion(seleccionarEnCurso);
  const { abrirNuevaSesion } = useAcciones();
  return {
    fechaEjecucion,
    salud,
    nuevaSesionDeshabilitada,
    abrirNuevaSesion,
    clasePrefijo: clasePrefijo(angosto),
  };
}
