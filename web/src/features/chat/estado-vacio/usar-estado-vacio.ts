import { seleccionarCasos, seleccionarFaltaConfig } from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlEstadoVacio } from "@web/types/ui.type.ts";
import { useId, useLayoutEffect, useRef } from "react";

function tieneElFoco(contenedor: HTMLDivElement | null): boolean {
  return contenedor?.contains(document.activeElement) ?? false;
}

export function useEstadoVacio(): ControlEstadoVacio {
  const casos = useSeleccion(seleccionarCasos);
  const faltaConfig = useSeleccion(seleccionarFaltaConfig);
  const idCasos = useId();
  const idAcciones = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const { enfocarCampoDelMensaje } = useAcciones();

  useLayoutEffect(() => {
    const nodo = contenedor.current;
    return () => {
      if (tieneElFoco(nodo)) enfocarCampoDelMensaje();
    };
  }, [enfocarCampoDelMensaje]);

  return {
    contenedor,
    idCasos,
    idAcciones,
    casos,
    mostrarCasos: faltaConfig || casos.length > 0,
    casosNoDisponibles: faltaConfig,
  };
}
