import { ID_CAMPO_MENSAJE } from "@web/config/constants/ui.constants.ts";
import { seleccionarCasos, seleccionarConfigCargada } from "@web/store/selectores.ts";
import { useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlEstadoVacio } from "@web/types/ui.type.ts";
import { useId, useLayoutEffect, useRef } from "react";

function pasarElFocoAlCompositor(contenedor: HTMLDivElement | null): void {
  if (contenedor === null || !contenedor.contains(document.activeElement)) return;
  document.getElementById(ID_CAMPO_MENSAJE)?.focus();
}

export function useEstadoVacio(): ControlEstadoVacio {
  const casos = useSeleccion(seleccionarCasos);
  const configCargada = useSeleccion(seleccionarConfigCargada);
  const idCasos = useId();
  const idAcciones = useId();
  const contenedor = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const nodo = contenedor.current;
    return () => pasarElFocoAlCompositor(nodo);
  }, []);

  return {
    contenedor,
    idCasos,
    idAcciones,
    casos,
    mostrarCasos: !configCargada || casos.length > 0,
    cargandoCasos: !configCargada,
  };
}
