import { seleccionarComprobando, seleccionarEstadoLlm, seleccionarZona } from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { EstadoModelo } from "@web/types/chat.type.ts";
import type { ControlAvisoModelo, EstadoModeloConAviso } from "@web/types/ui.type.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";

function estadoConAviso(estado: EstadoModelo | null): EstadoModeloConAviso | null {
  return estado === null || estado === ESTADO_LLM.DISPONIBLE ? null : estado;
}

export function useAvisoModelo(): ControlAvisoModelo {
  const estado = useSeleccion(seleccionarEstadoLlm);
  const zona = useSeleccion(seleccionarZona);
  const comprobando = useSeleccion(seleccionarComprobando);
  const { refrescarSalud } = useAcciones();
  return { estado: estadoConAviso(estado), zona, comprobando, alComprobar: refrescarSalud };
}
